#!/bin/bash
# IncidentIQ Database Backup Script
# Run via cron: 0 2 * * * /opt/incidentiq/deployment/backup.sh

set -euo pipefail

BACKUP_DIR="/opt/backups/incidentiq"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/incidentiq_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Source env if available
[ -f /opt/incidentiq/.env ] && source /opt/incidentiq/.env

echo "[$(date)] Starting backup..."

docker compose -f /opt/incidentiq/deployment/docker-compose.yml exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-incidentiq}" "${POSTGRES_DB:-incidentiq}" \
  | gzip > "$BACKUP_FILE"

echo "[$(date)] Backup written to $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"

# Prune old backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "[$(date)] Pruned backups older than ${RETENTION_DAYS} days"

echo "[$(date)] Backup complete"
