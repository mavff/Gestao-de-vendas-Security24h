#!/usr/bin/env bash
# Backup local do Postgres (EasyPanel / Hostinger VPS).
# Roda na VPS, via cron — NÃO dentro de container.
#
# Setup (uma vez):
#   sudo mkdir -p /root/backups/sec24h
#   sudo cp scripts/backup-postgres.sh /root/backup-postgres.sh
#   sudo chmod +x /root/backup-postgres.sh
#   sudo crontab -e
#     # rodar todo dia 03:00
#     0 3 * * * /root/backup-postgres.sh >> /var/log/sec24h-backup.log 2>&1
#
# Restaurar um backup:
#   gunzip -c /root/backups/sec24h/sec24h_app_YYYYMMDD-HHMMSS.sql.gz | \
#     docker exec -i <postgres-container> psql -U sec24h -d sec24h_app

set -euo pipefail

CONTAINER_NAME_MATCH="${PG_CONTAINER:-postgress_gestao_de_vendas}"
BACKUP_DIR="${BACKUP_DIR:-/root/backups/sec24h}"
KEEP_DAYS="${KEEP_DAYS:-7}"

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/sec24h_app_${STAMP}.sql.gz"

# Localiza o container (EasyPanel/Swarm acrescenta sufixo no nome)
CID=$(docker ps --filter "name=${CONTAINER_NAME_MATCH}" --format "{{.ID}}" | head -n1)
if [ -z "${CID:-}" ]; then
  echo "[$(date -Is)] [ERR] Container com '${CONTAINER_NAME_MATCH}' não encontrado" >&2
  echo "[$(date -Is)] Containers ativos:" >&2
  docker ps --format "  {{.Names}}" >&2
  exit 1
fi

echo "[$(date -Is)] container=$CID → $OUT"

# Usa POSTGRES_USER/DB/PASSWORD do próprio container — sem secrets no host
docker exec "$CID" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" --no-owner --no-acl "$POSTGRES_DB"' \
  | gzip -9 > "$OUT"

SIZE=$(du -h "$OUT" | cut -f1)
echo "[$(date -Is)] ok — $SIZE"

# Retenção: remove arquivos mais antigos que $KEEP_DAYS dias
DELETED=$(find "$BACKUP_DIR" -type f -name 'sec24h_app_*.sql.gz' -mtime "+${KEEP_DAYS}" -print -delete | wc -l)
echo "[$(date -Is)] retenção ${KEEP_DAYS}d — removidos=${DELETED}, mantidos=$(ls -1 "$BACKUP_DIR"/sec24h_app_*.sql.gz 2>/dev/null | wc -l)"
