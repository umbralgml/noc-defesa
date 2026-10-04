#!/usr/bin/env bash
# Instala (ou atualiza) a API do ranking no mesmo servidor do jogo:
# PostgreSQL (banco "noc") + PostgREST (só em 127.0.0.1:3000) + nginx em https://SEU-DOMINIO/rest/v1/
# + backup diário + aplicação automática do tools/ranking.sql nas atualizações.
#
# Pré-requisito: o jogo já instalado com deploy/install.sh (nginx, HTTPS e /var/www/noc-defesa).
#
#   sudo bash /var/www/noc-defesa/deploy/vps/instalar-api.sh
#
# Rodar de novo é seguro: mantém o banco, os dados e a senha; só atualiza o que mudou.
# Opções:
#   --dir CAMINHO   pasta do jogo (padrão: /var/www/noc-defesa)
#   --sem-backup    não agenda o backup diário
set -euo pipefail

DIR="/var/www/noc-defesa"; DB="noc"; NAME="noc-defesa"; BACKUP=1
PGRST_VER="v12.2.3"
while [ $# -gt 0 ]; do
  case "$1" in
    --dir) DIR="$2"; shift ;;
    --sem-backup) BACKUP=0 ;;
    -h|--help) sed -n '2,14p' "$0"; exit 0 ;;
    *) echo "opção desconhecida: $1" >&2; exit 1 ;;
  esac; shift
done

say() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
ok()  { printf '\033[1;32m ✓\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m ✗ %s\033[0m\n' "$*" >&2; exit 1; }
VPS="$DIR/deploy/vps"
export PGOPTIONS="-c client_min_messages=warning"   # sem os avisos de "já existe" do SQL idempotente
psql_db() { runuser -u postgres -- psql -q -v ON_ERROR_STOP=1 -d "$DB" "$@"; }

[ "$(id -u)" -eq 0 ] || die "Rode como root (sudo)."
[ -d /run/systemd/system ] || die "Precisa de systemd."
[ -f "$DIR/tools/ranking.sql" ] && [ -f "$VPS/roles.sql" ] || die "Jogo não encontrado em $DIR. Rode antes o deploy/install.sh."
command -v nginx >/dev/null || die "nginx não encontrado. A API usa o nginx do jogo (deploy/install.sh)."
grep -qs "snippets/$NAME-\*.conf" "/etc/nginx/sites-available/$NAME.conf" \
  || die "O site do nginx é de uma versão antiga do instalador. Rode de novo: sudo bash $DIR/deploy/install.sh SEU-DOMINIO"

# ---------- PostgreSQL ----------
say "PostgreSQL"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq postgresql xz-utils curl ca-certificates openssl >/dev/null
systemctl enable -q --now postgresql
# Só escuta local (padrão do Debian/Ubuntu). Confere em vez de supor.
LISTEN=$(runuser -u postgres -- psql -tAc "show listen_addresses")
[ "$LISTEN" = "localhost" ] || [ "$LISTEN" = "127.0.0.1" ] || die "PostgreSQL escutando em '$LISTEN'. Deixe listen_addresses = 'localhost' antes de continuar."
runuser -u postgres -- psql -tAc "select 1 from pg_database where datname='$DB'" | grep -q 1 \
  || runuser -u postgres -- createdb "$DB"
psql_db -f "$VPS/roles.sql"
psql_db -f "$DIR/tools/ranking.sql"
mkdir -p /var/lib/noc-defesa
sha256sum "$DIR/tools/ranking.sql" | cut -d' ' -f1 > /var/lib/noc-defesa/ranking.sha
ok "banco \"$DB\" pronto ($(runuser -u postgres -- psql -tAc 'show server_version' | cut -d' ' -f1))"

# ---------- PostgREST ----------
say "PostgREST $PGRST_VER"
case "$(uname -m)" in
  x86_64) ASSET="postgrest-$PGRST_VER-linux-static-x64.tar.xz" ;;
  aarch64) ASSET="postgrest-$PGRST_VER-ubuntu-aarch64.tar.xz" ;;
  *) die "Arquitetura $(uname -m) sem binário pronto do PostgREST." ;;
esac
if ! /usr/local/bin/postgrest --version 2>/dev/null | grep -q "${PGRST_VER#v}"; then
  TMP=$(mktemp -d)
  curl -fsSL -o "$TMP/p.tar.xz" "https://github.com/PostgREST/postgrest/releases/download/$PGRST_VER/$ASSET"
  tar -xJf "$TMP/p.tar.xz" -C "$TMP"
  install -m 755 "$TMP/postgrest" /usr/local/bin/postgrest
  rm -rf "$TMP"
fi
ok "$(/usr/local/bin/postgrest --version 2>&1 | head -1)"
id postgrest >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin postgrest
mkdir -p /etc/postgrest
CONF=/etc/postgrest/noc.conf
if [ -f "$CONF" ]; then
  PASS=$(sed -n 's#^db-uri = "postgres://authenticator:\([^@]*\)@.*#\1#p' "$CONF")
fi
[ -n "${PASS:-}" ] || PASS=$(openssl rand -hex 24)
printf "alter role authenticator with password '%s';\n" "$PASS" | psql_db   # pela entrada padrão: a senha não aparece no ps
sed "s#SENHA_GERADA#$PASS#; s#/noc\"#/$DB\"#" "$VPS/postgrest.conf.example" > "$CONF"
chown root:postgrest "$CONF"; chmod 640 "$CONF"
install -m 644 "$VPS/postgrest.service" /etc/systemd/system/postgrest.service
systemctl daemon-reload
systemctl enable -q postgrest
systemctl restart postgrest
for _ in $(seq 1 20); do curl -fs -o /dev/null "http://127.0.0.1:3000/ranking_top?limit=1" && break; sleep 0.5; done
curl -fs -o /dev/null "http://127.0.0.1:3000/ranking_top?limit=1" || die "PostgREST não respondeu. Veja: journalctl -u postgrest -n 50"
ok "API local respondendo em 127.0.0.1:3000"

# ---------- nginx ----------
say "nginx em /rest/v1/"
install -m 644 "$VPS/nginx-api-zone.conf" "/etc/nginx/conf.d/$NAME-api-zone.conf"
install -m 644 "$VPS/nginx-api.conf" "/etc/nginx/snippets/$NAME-api.conf"
nginx -t 2>&1 | tail -1
systemctl reload nginx
ok "nginx recarregado"

# ---------- backup e atualização do banco ----------
say "Backup diário e migração automática"
install -m 755 "$VPS/noc-backup.sh" /usr/local/bin/noc-backup
install -m 755 "$VPS/noc-pos-atualizar.sh" /usr/local/bin/noc-pos-atualizar
if [ "$BACKUP" -eq 1 ]; then
  cat > /etc/systemd/system/noc-backup.service <<'SVC'
[Unit]
Description=Backup do banco do ranking do NOC
[Service]
Type=oneshot
ExecStart=/usr/local/bin/noc-backup
SVC
  cat > /etc/systemd/system/noc-backup.timer <<'TMR'
[Unit]
Description=Backup diário do banco do ranking do NOC
[Timer]
OnCalendar=*-*-* 03:30:00
Persistent=true
[Install]
WantedBy=timers.target
TMR
  systemctl daemon-reload
  systemctl enable -q --now noc-backup.timer
  /usr/local/bin/noc-backup
fi
ok "noc-backup e noc-pos-atualizar instalados"

# ---------- resumo ----------
DOMAIN=$(sed -n 's/^ *server_name \([^ ;]*\).*/\1/p' "/etc/nginx/sites-available/$NAME.conf" | head -1)
echo
echo "API do ranking pronta."
echo "   Teste local:   curl -s 'http://127.0.0.1:3000/ranking_top?limit=3'"
echo "   Teste público: curl -s 'https://$DOMAIN/rest/v1/ranking_top?limit=3'"
echo "   Logs:          journalctl -u postgrest -f"
echo "   Backup agora:  sudo noc-backup   (arquivos em /var/backups/noc)"
echo
echo "Para o jogo usar esta API, o src/config.json no GitHub deve ficar assim:"
echo "   { \"ranking\": { \"url\": \"https://$DOMAIN\", \"key\": \"\" } }"
