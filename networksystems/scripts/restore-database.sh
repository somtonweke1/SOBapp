#!/bin/bash
set -e

###############################################################################
# Database Restore Script
# Restores database from backup with verification
###############################################################################

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
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

# Check if backup file is provided
if [ -z "$1" ]; then
    log_error "Usage: $0 <backup-file>"
    log_info "Available backups:"
    ls -lh "$BACKUP_DIR"/backup_* 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

log_info "Restoring database from: $BACKUP_FILE"

# Verify checksum if available
CHECKSUM_FILE="$BACKUP_FILE.sha256"
if [ -f "$CHECKSUM_FILE" ]; then
    log_info "Verifying backup integrity..."
    sha256sum -c "$CHECKSUM_FILE"
    if [ $? -eq 0 ]; then
        log_info "Backup integrity verified ✓"
    else
        log_error "Backup integrity check failed!"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    log_warn "Checksum file not found, skipping verification"
fi

# Confirm restoration
log_warn "⚠️  WARNING: This will overwrite the current database!"
log_info "Database URL: $DATABASE_URL"
read -p "Are you sure you want to continue? (yes/NO) " -r
echo
if [[ ! $REPLY =~ ^yes$ ]]; then
    log_info "Restoration cancelled"
    exit 0
fi

# Detect database type
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

# Create backup of current database before restore
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
log_info "Creating safety backup before restore..."
bash "$(dirname "$0")/backup-database.sh"

# Perform restore based on database type
if [ "$DB_TYPE" = "postgres" ]; then
    # PostgreSQL restore
    log_info "Restoring PostgreSQL database..."

    # Drop and recreate database (careful!)
    log_warn "Dropping existing data..."

    # Decompress and restore
    gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"

    if [ $? -eq 0 ]; then
        log_info "PostgreSQL database restored successfully"
    else
        log_error "PostgreSQL restore failed"
        exit 1
    fi

elif [ "$DB_TYPE" = "sqlite" ]; then
    # SQLite restore
    DB_PATH=$(echo "$DATABASE_URL" | sed 's/file://')
    log_info "Restoring SQLite database to: $DB_PATH"

    # Decompress backup
    TEMP_FILE="/tmp/restore_temp_$TIMESTAMP.db"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"

    # Backup current database
    if [ -f "$DB_PATH" ]; then
        mv "$DB_PATH" "$DB_PATH.before_restore_$TIMESTAMP"
        log_info "Current database backed up to: $DB_PATH.before_restore_$TIMESTAMP"
    fi

    # Restore from backup
    mv "$TEMP_FILE" "$DB_PATH"

    if [ $? -eq 0 ]; then
        log_info "SQLite database restored successfully"
    else
        log_error "SQLite restore failed"
        # Attempt to restore previous database
        if [ -f "$DB_PATH.before_restore_$TIMESTAMP" ]; then
            mv "$DB_PATH.before_restore_$TIMESTAMP" "$DB_PATH"
            log_warn "Restored previous database"
        fi
        exit 1
    fi
fi

# Verify restored database
log_info "Verifying restored database..."

if [ "$DB_TYPE" = "postgres" ]; then
    # Check PostgreSQL connection
    psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null
    if [ $? -eq 0 ]; then
        log_info "Database connection verified ✓"
    else
        log_error "Database connection failed"
        exit 1
    fi
elif [ "$DB_TYPE" = "sqlite" ]; then
    # Check SQLite integrity
    sqlite3 "$DB_PATH" "PRAGMA integrity_check;" | grep -q "ok"
    if [ $? -eq 0 ]; then
        log_info "Database integrity verified ✓"
    else
        log_error "Database integrity check failed"
        exit 1
    fi
fi

# Run Prisma migrations to ensure schema is up-to-date
log_info "Running Prisma migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    log_info "Migrations applied successfully"
else
    log_warn "Migration warning - please check manually"
fi

# Send notification
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "{\"text\": \"✅ Database restored successfully\n• Source: $(basename $BACKUP_FILE)\n• Time: $TIMESTAMP\"}" \
        &> /dev/null
fi

log_info "Database restoration completed successfully!"
log_info "Restored from: $BACKUP_FILE"

exit 0
