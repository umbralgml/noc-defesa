#!/bin/sh
# /usr/local/bin/noc-backup: cópia diária do banco do ranking (formato custom do pg_dump).
# Guarda 14 dias em /var/backups/noc. Restaurar: veja docs/VPS.md, seção "Backup e restauração".
set -e
DEST=/var/backups/noc
mkdir -p "$DEST"; chmod 700 "$DEST"
F="$DEST/noc-$(date +%Y%m%d-%H%M%S).dump"
runuser -u postgres -- pg_dump -Fc noc > "$F.tmp" && mv "$F.tmp" "$F"
find "$DEST" -name 'noc-*.dump' -mtime +14 -delete
echo "backup: $F ($(du -h "$F" | cut -f1))"
