#!/usr/bin/env bash
# Instala (ou atualiza) o "NOC: Última Linha de Defesa" num servidor Ubuntu/Debian.
#
#   curl -fsSL https://raw.githubusercontent.com/umbralgml/noc-defesa/main/deploy/install.sh \
#     | sudo bash -s -- noc.zioncore.com.br voce@email.com
#
# O que faz: baixa o jogo do GitHub, cria o site no nginx (ou no Apache, se ele já
# atende a porta 80), libera o firewall, emite HTTPS com Let's Encrypt e agenda a
# atualização automática a partir do GitHub. Rodar de novo é seguro: só atualiza.
#
# Opções:
#   --sem-ssl          não emite certificado (ex.: DNS ainda não propagou)
#   --sem-atualizacao  não agenda a atualização automática
#   --branch NOME      branch do GitHub (padrão: main)
#   --dir CAMINHO      pasta do site (padrão: /var/www/noc-defesa)
#   --remover          desinstala (site, atualização e arquivos; mantém o certificado)
set -euo pipefail

REPO="https://github.com/umbralgml/noc-defesa.git"
BRANCH="main"; DIR="/var/www/noc-defesa"; SSL=1; AUTO=1; REMOVE=0
DOMAIN=""; EMAIL=""
NAME="noc-defesa"

say()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m ✓\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m !\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m ✗ %s\033[0m\n' "$*" >&2; exit 1; }
has()  { command -v "$1" >/dev/null 2>&1; }
systemd_on() { [ -d /run/systemd/system ]; }
svc() { # svc acao servico  (funciona com ou sem systemd)
  if systemd_on; then systemctl "$1" "$2"; else service "$2" "$1"; fi
}

while [ $# -gt 0 ]; do
  case "$1" in
    --sem-ssl) SSL=0 ;;
    --sem-atualizacao) AUTO=0 ;;
    --branch) BRANCH="$2"; shift ;;
    --dir) DIR="$2"; shift ;;
    --remover) REMOVE=1 ;;
    -h|--help) sed -n '2,20p' "$0" 2>/dev/null || true; exit 0 ;;
    -*) die "opção desconhecida: $1" ;;
    *) if [ -z "$DOMAIN" ]; then DOMAIN="$1"; elif [ -z "$EMAIL" ]; then EMAIL="$1"; else die "argumento a mais: $1"; fi ;;
  esac
  shift
done

[ "$(id -u)" -eq 0 ] || die "rode como root (use sudo)."
has apt-get || die "este instalador é para Ubuntu/Debian (apt)."
[ -n "$DOMAIN" ] || die "informe o domínio. Ex.: sudo bash install.sh noc.zioncore.com.br voce@email.com"
echo "$DOMAIN" | grep -Eq '^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' || die "domínio inválido: $DOMAIN"

NGINX_CONF="/etc/nginx/sites-available/$NAME.conf"
APACHE_CONF="/etc/apache2/sites-available/$NAME.conf"

# ---------- desinstalar ----------
if [ "$REMOVE" -eq 1 ]; then
  say "Removendo o NOC de $DOMAIN"
  if systemd_on; then systemctl disable --now "$NAME-update.timer" 2>/dev/null || true; fi
  rm -f "/etc/systemd/system/$NAME-update.service" "/etc/systemd/system/$NAME-update.timer" "/etc/cron.d/$NAME" /usr/local/bin/noc-atualizar
  if [ -f "$NGINX_CONF" ]; then rm -f "/etc/nginx/sites-enabled/$NAME.conf" "$NGINX_CONF"; nginx -t && svc reload nginx; fi
  if [ -f "$APACHE_CONF" ]; then a2dissite -q "$NAME" "$NAME-le-ssl" 2>/dev/null || true; rm -f "$APACHE_CONF" "/etc/apache2/sites-available/$NAME-le-ssl.conf"; apachectl configtest && svc reload apache2; fi
  rm -rf "$DIR"
  ok "Removido. O certificado continua em /etc/letsencrypt (apague com: certbot delete --cert-name $DOMAIN)."
  exit 0
fi

say "Instalando o NOC em https://$DOMAIN"
export DEBIAN_FRONTEND=noninteractive

# ---------- servidor web: usa o que já existe ----------
port80() { ss -ltnpH 'sport = :80' 2>/dev/null || true; }
apt-get update -qq
apt-get install -y -qq git curl ca-certificates iproute2 >/dev/null
P80="$(port80)"
if echo "$P80" | grep -q apache2 || { [ -z "$P80" ] && has apache2 && ! has nginx; }; then
  WEB=apache
elif [ -z "$P80" ] || echo "$P80" | grep -q nginx; then
  WEB=nginx
else
  die "a porta 80 está ocupada por outro programa: $(echo "$P80" | grep -o 'users:.*' | head -1). Configure o proxy dele para a pasta $DIR manualmente (veja docs/SERVIDOR.md)."
fi
if [ "$WEB" = nginx ] && ! has nginx; then
  say "Instalando nginx"; apt-get install -y -qq nginx >/dev/null
fi
ok "Servidor web: $WEB"

# ---------- código do jogo ----------
say "Baixando o jogo ($REPO, branch $BRANCH)"
git config --global --add safe.directory "$DIR" 2>/dev/null || true
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" fetch -q --depth 1 origin "$BRANCH"
  git -C "$DIR" reset -q --hard FETCH_HEAD
else
  [ -e "$DIR" ] && [ -n "$(ls -A "$DIR" 2>/dev/null)" ] && die "$DIR já existe e não está vazio. Use --dir para outra pasta."
  mkdir -p "$(dirname "$DIR")"
  git clone -q --depth 1 -b "$BRANCH" "$REPO" "$DIR"
fi
chmod -R a+rX "$DIR"
ok "Versão: $(git -C "$DIR" log -1 --format='%h · %s')"

# ---------- site ----------
if [ "$WEB" = nginx ]; then
  V6=""; [ -s /proc/net/if_inet6 ] && V6="    listen [::]:80;"   # só se o servidor tem IPv6
  mkdir -p /etc/nginx/snippets
  cat > "$NGINX_CONF" <<NGX
# NOC: Última Linha de Defesa (gerado por deploy/install.sh)
server {
    listen 80;
$V6
    server_name $DOMAIN;
    root $DIR;
    index index.html;
    charset utf-8;

    gzip on;
    gzip_types text/css application/javascript application/json application/manifest+json image/svg+xml;

    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header X-Frame-Options SAMEORIGIN always;

    # Nada de .git, scripts de deploy ou ferramentas.
    location ~ /\.(?!well-known) { deny all; }
    location ~ ^/(deploy|tools)/ { deny all; }

    location = /manifest.webmanifest { types { } default_type application/manifest+json; expires -1; }
    location ~* \.(png|svg|ico)$ { expires 7d; }
    # HTML, JS e JSON sempre revalidados: atualização aparece na hora.
    location / { try_files \$uri \$uri/ =404; expires -1; }

    # Extras deste servidor (ex.: API do ranking, criada por deploy/vps/instalar-api.sh).
    # Ficam fora deste arquivo para sobreviver quando o instalador roda de novo.
    include /etc/nginx/snippets/$NAME-*.conf;
}
NGX
  ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$NAME.conf"
  nginx -t 2>&1 | tail -1
  if pgrep -x nginx >/dev/null; then svc reload nginx; else svc start nginx; fi
else
  a2enmod -q headers >/dev/null
  cat > "$APACHE_CONF" <<APC
# NOC: Última Linha de Defesa (gerado por deploy/install.sh)
<VirtualHost *:80>
    ServerName $DOMAIN
    DocumentRoot $DIR
    <Directory $DIR>
        Options -Indexes
        AllowOverride None
        Require all granted
    </Directory>
    RedirectMatch 404 /\\.git
    <LocationMatch "^/(deploy|tools)/">
        Require all denied
    </LocationMatch>
    AddType application/manifest+json .webmanifest
    AddDefaultCharset utf-8
    Header always set X-Content-Type-Options nosniff
    Header always set Referrer-Policy strict-origin-when-cross-origin
    <FilesMatch "\\.(html|js|json|css|webmanifest)$">
        Header set Cache-Control "no-cache"
    </FilesMatch>
</VirtualHost>
APC
  a2ensite -q "$NAME" >/dev/null
  apachectl configtest
  apachectl graceful   # recarrega; se o Apache estiver parado, sobe
fi
ok "Site criado para $DOMAIN"

# ---------- firewall ----------
if has ufw && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null; ok "Firewall (ufw): portas 80 e 443 liberadas"
fi

# ---------- HTTPS ----------
if [ "$SSL" -eq 1 ]; then
  MYIP="$(curl -4 -fsS --max-time 8 https://api.ipify.org 2>/dev/null || true)"
  DNSIP="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk 'NR==1{print $1}' || true)"
  if [ -z "$DNSIP" ]; then
    warn "O domínio $DOMAIN ainda não resolve. Crie o registro DNS do tipo A apontando para ${MYIP:-o IP público deste servidor} e rode este instalador de novo."
    SSL=0
  elif [ -n "$MYIP" ] && [ "$DNSIP" != "$MYIP" ]; then
    warn "$DOMAIN aponta para $DNSIP, mas este servidor é $MYIP. Se usa Cloudflare com proxy (nuvem laranja), desligue o proxy até emitir o certificado. Pulando HTTPS por enquanto."
    SSL=0
  else
    say "Emitindo certificado HTTPS (Let's Encrypt)"
    apt-get install -y -qq certbot "python3-certbot-$WEB" >/dev/null
    if [ -n "$EMAIL" ]; then MAIL=(-m "$EMAIL"); else MAIL=(--register-unsafely-without-email); fi
    certbot --"$WEB" -d "$DOMAIN" "${MAIL[@]}" --agree-tos --non-interactive --redirect --keep-until-expiring -q
    ok "HTTPS ativo (renovação automática pelo certbot)"
  fi
fi

# ---------- atualização automática ----------
cat > /usr/local/bin/noc-atualizar <<UPD
#!/bin/sh
# Atualiza o NOC a partir do GitHub ($BRANCH). Gerado por deploy/install.sh.
set -e
cd "$DIR"
git fetch -q --depth 1 origin "$BRANCH"
if [ "\$(git rev-parse HEAD)" != "\$(git rev-parse FETCH_HEAD)" ]; then
  git reset -q --hard FETCH_HEAD
  chmod -R a+rX "$DIR"
  echo "NOC atualizado: \$(git log -1 --format='%h %s')"
  # Passos extras deste servidor (ex.: aplicar mudanças no banco do ranking).
  if [ -x /usr/local/bin/noc-pos-atualizar ]; then /usr/local/bin/noc-pos-atualizar || echo "noc-pos-atualizar falhou" >&2; fi
fi
UPD
chmod 755 /usr/local/bin/noc-atualizar
if [ "$AUTO" -eq 1 ]; then
  if systemd_on; then
    cat > "/etc/systemd/system/$NAME-update.service" <<SVC
[Unit]
Description=Atualiza o NOC a partir do GitHub
After=network-online.target
[Service]
Type=oneshot
ExecStart=/usr/local/bin/noc-atualizar
SVC
    cat > "/etc/systemd/system/$NAME-update.timer" <<TMR
[Unit]
Description=Atualiza o NOC a cada 15 minutos
[Timer]
OnBootSec=2min
OnUnitActiveSec=15min
RandomizedDelaySec=60
[Install]
WantedBy=timers.target
TMR
    systemctl daemon-reload
    systemctl enable --now "$NAME-update.timer" >/dev/null
  else
    echo "*/15 * * * * root /usr/local/bin/noc-atualizar >/dev/null 2>&1" > "/etc/cron.d/$NAME"
  fi
  ok "Atualização automática: a cada 15 minutos a partir do GitHub ($BRANCH)"
fi

# ---------- conferência ----------
SCHEME=http; [ "$SSL" -eq 1 ] && SCHEME=https
CODE="$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $DOMAIN" http://127.0.0.1/ || true)"
[ "$CODE" = 200 ] || [ "$CODE" = 301 ] || [ "$CODE" = 302 ] || warn "Teste local devolveu HTTP $CODE. Confira com: curl -I -H 'Host: $DOMAIN' http://127.0.0.1/"

echo
ok "Pronto! Jogue em: $SCHEME://$DOMAIN"
echo "   Atualizar agora:  sudo noc-atualizar"
echo "   Desinstalar:      sudo bash $DIR/deploy/install.sh $DOMAIN --remover"
[ "$SSL" -eq 1 ] || echo "   Sem HTTPS ainda: o app (PWA) só instala com HTTPS. Rode de novo depois do DNS."
