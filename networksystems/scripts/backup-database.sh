#!/bin/bash
set -e

###############################################################################
# Database Backup Script
# Backs up PostgreSQL/SQLite database with rotation and verification
###############################################################################

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE_URL="${DATABASE_URL}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log_info "Starting database backup at $TIMESTAMP"

# Detect database type from DATABASE_URL
if [[ $DATABASE_URL == postgresql://* ]] || [[ $DATABASE_URL == postgres://* ]]; then
    DB_TYPE="postgres"
    log_info "Detected PostgreSQL database"
elif [[ $DATABASE_URL == file:* ]]; then
    DB_TYPE="sqlite"
    log_info "Detected SQLite database"
else
    log_error "Unknown database type"
    exit 1
fi

# Perform backup based on database type
if [ "$DB_TYPE" = "postgres" ]; then
    # PostgreSQL backup
    BACKUP_FILE="$BACKUP_DIR/backup_postgres_$TIMESTAMP.sql.gz"

    log_info "Backing up PostgreSQL database..."

    # Extract connection details from DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        log_info "PostgreSQL backup created: $BACKUP_FILE"
    else
        log_error "PostgreSQL backup failed"
        exit 1
    fi

elif [ "$DB_TYPE" = "sqlite" ]; then
    # SQLite backup
    DB_PATH=$(echo "$DATABASE_URL" | sed 's/file://')
    BACKUP_FILE="$BACKUP_DIR/backup_sqlite_$TIMESTAMP.db"

    log_info "Backing up SQLite database from $DB_PATH..."

    if [ -f "$DB_PATH" ]; then
        # Use SQLite backup command
        sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

        # Compress the backup
        gzip "$BACKUP_FILE"
        BACKUP_FILE="$BACKUP_FILE.gz"

        if [ $? -eq 0 ]; then
            log_info "SQLite backup created: $BACKUP_FILE"
        else
            log_error "SQLite backup failed"
            exit 1
        fi
    else
        log_error "Database file not found: $DB_PATH"
        exit 1
    fi
fi

# Verify backup file
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "Backup size: $BACKUP_SIZE"

    # Check if backup is not empty
    if [ ! -s "$BACKUP_FILE" ]; then
        log_error "Backup file is empty!"
        exit 1
    fi
else
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Create checksum for verification
CHECKSUM_FILE="$BACKUP_FILE.sha256"
sha256sum "$BACKUP_FILE" > "$CHECKSUM_FILE"
log_info "Checksum created: $CHECKSUM_FILE"

# Rotate old backups (delete backups older than RETENTION_DAYS)
log_info "Rotating old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "backup_*" -type f -mtime +$RETENTION_DAYS -delete
DELETED=$(find "$BACKUP_DIR" -name "backup_*" -type f -mtime +$RETENTION_DAYS | wc -l)
if [ $DELETED -gt 0 ]; then
    log_info "Deleted $DELETED old backup(s)"
else
    log_info "No old backups to delete"
fi

# List current backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "backup_*" -type f | wc -l)
log_info "Total backups: $BACKUP_COUNT"

# Upload to S3 (if configured)
if [ -n "$BACKUP_S3_BUCKET" ]; then
    log_info "Uploading backup to S3: s3://$BACKUP_S3_BUCKET/"

    if command -v aws &> /dev/null; then
        aws s3 cp "$BACKUP_FILE" "s3://$BACKUP_S3_BUCKET/backups/"
        aws s3 cp "$CHECKSUM_FILE" "s3://$BACKUP_S3_BUCKET/backups/"

        if [ $? -eq 0 ]; then
            log_info "Backup uploaded to S3 successfully"
        else
            log_warn "S3 upload failed"
        fi
    else
        log_warn "AWS CLI not installed, skipping S3 upload"
    fi
fi

# Send notification (optional)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "{\"text\": \"✅ Database backup completed successfully\n• Size: $BACKUP_SIZE\n• File: $(basename $BACKUP_FILE)\n• Time: $TIMESTAMP\"}" \
        &> /dev/null
fi

log_info "Backup completed successfully!"
log_info "Backup file: $BACKUP_FILE"
log_info "Checksum: $CHECKSUM_FILE"

exit 0
