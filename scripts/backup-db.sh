#!/usr/bin/env bash
# GroupWatch Platform — PostgreSQL backup script
# Usage: ./scripts/backup-db.sh
# Designed to run as a daily cron job on the VPS.
# Recommended crontab entry:
#   0 3 * * * /opt/groupwatch/scripts/backup-db.sh >> /var/log/groupwatch-backup.log 2>&1

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/groupwatch/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="groupwatch_${TIMESTAMP}.sql.gz"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[ERROR] DATABASE_URL is not set. Aborting." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting backup → ${BACKUP_DIR}/${FILENAME}"

pg_dump "$DATABASE_URL" | gzip > "${BACKUP_DIR}/${FILENAME}"

SIZE=$(du -sh "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup complete — ${FILENAME} (${SIZE})"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Removing backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "groupwatch_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Cleanup done."
