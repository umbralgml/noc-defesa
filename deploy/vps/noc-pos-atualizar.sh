#!/bin/sh
# /usr/local/bin/noc-pos-atualizar: roda depois de cada atualização do jogo (chamado pelo noc-atualizar).
# Se tools/ranking.sql mudou, aplica no banco (o arquivo é idempotente) e recarrega o PostgREST.
set -e
export PGOPTIONS="-c client_min_messages=warning"   # sem os avisos de "já existe" do SQL idempotente
DIR=/var/www/noc-defesa; STATE=/var/lib/noc-defesa; mkdir -p "$STATE"
NEW=$(sha256sum "$DIR/tools/ranking.sql" | cut -d' ' -f1)
OLD=$(cat "$STATE/ranking.sha" 2>/dev/null || true)
[ "$NEW" = "$OLD" ] && exit 0
/usr/local/bin/noc-backup >/dev/null    # cópia antes de mexer no banco
runuser -u postgres -- psql -q -v ON_ERROR_STOP=1 -d noc -f "$DIR/tools/ranking.sql"
runuser -u postgres -- psql -q -d noc -c "notify pgrst, 'reload schema'"
echo "$NEW" > "$STATE/ranking.sha"
echo "banco do ranking atualizado (tools/ranking.sql)"
