#!/bin/bash
# Database backup script for Railway

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/app/backups"
DB_PATH="/app/data/arena.db"
BACKUP_FILE="$BACKUP_DIR/arena_backup_$DATE.db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create SQLite backup
sqlite3 $DB_PATH ".backup $BACKUP_FILE"

# Compress backup
gzip $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "arena_backup_*.db.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"

# Optional: Upload to cloud storage (S3, GCS, etc.)
# Uncomment and configure as needed:
# aws s3 cp ${BACKUP_FILE}.gz s3://your-bucket/backups/
