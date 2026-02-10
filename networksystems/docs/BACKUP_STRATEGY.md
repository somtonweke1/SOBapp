# Database Backup & Restore Strategy

Comprehensive database backup and restoration procedures for the SOBapp platform.

## Table of Contents

- [Overview](#overview)
- [Backup Strategy](#backup-strategy)
- [Backup Scripts](#backup-scripts)
- [Restore Procedures](#restore-procedures)
- [Automation & Scheduling](#automation--scheduling)
- [Monitoring & Alerts](#monitoring--alerts)
- [Best Practices](#best-practices)
- [Disaster Recovery](#disaster-recovery)

## Overview

The SOBapp platform implements a comprehensive backup strategy to ensure data integrity and business continuity. Our backup system supports both PostgreSQL (production) and SQLite (development) databases.

### Key Features

- **Automated Backups**: Scheduled daily backups with configurable retention
- **Integrity Verification**: SHA-256 checksums for backup validation
- **Cloud Storage**: Optional S3 upload for off-site storage
- **Rotation Policy**: Automatic cleanup of old backups based on retention period
- **Multiple Database Support**: PostgreSQL and SQLite
- **Compression**: All backups are gzip-compressed to save storage
- **Safety Checks**: Pre-restore safety backups and integrity verification

## Backup Strategy

### Backup Types

#### 1. Automated Daily Backups

Daily backups run automatically via cron job or GitHub Actions:

```bash
# Daily at 2 AM
0 2 * * * cd /path/to/app && ./scripts/backup-database.sh
```

#### 2. Pre-Deployment Backups

Automated backups before each deployment:

```yaml
# In GitHub Actions
- name: Backup database
  run: ./scripts/backup-database.sh
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

#### 3. Manual Backups

On-demand backups for maintenance or testing:

```bash
./scripts/backup-database.sh
```

### Retention Policy

- **Default**: 30 days
- **Configurable**: Set `BACKUP_RETENTION_DAYS` environment variable
- **Automatic Cleanup**: Old backups are deleted during each backup run

### Storage Locations

#### Local Storage

```
backups/
├── backup_postgres_20251016_020000.sql.gz
├── backup_postgres_20251016_020000.sql.gz.sha256
├── backup_postgres_20251015_020000.sql.gz
└── backup_postgres_20251015_020000.sql.gz.sha256
```

#### S3 Storage (Optional)

```
s3://your-bucket/backups/
├── backup_postgres_20251016_020000.sql.gz
├── backup_postgres_20251016_020000.sql.gz.sha256
└── ...
```

## Backup Scripts

### backup-database.sh

Located at `scripts/backup-database.sh`

#### Usage

```bash
# Basic usage (uses environment variables)
./scripts/backup-database.sh

# With custom configuration
BACKUP_DIR=/custom/path \
BACKUP_RETENTION_DAYS=60 \
DATABASE_URL="postgresql://..." \
./scripts/backup-database.sh

# With S3 upload
BACKUP_S3_BUCKET=my-backups \
./scripts/backup-database.sh
```

#### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | Required |
| `BACKUP_DIR` | Backup storage directory | `./backups` |
| `BACKUP_RETENTION_DAYS` | Days to keep backups | `30` |
| `BACKUP_S3_BUCKET` | S3 bucket for uploads | None |
| `SLACK_WEBHOOK_URL` | Slack notification webhook | None |

#### Features

- **Auto-detection**: Automatically detects PostgreSQL or SQLite
- **Compression**: All backups are gzip-compressed
- **Verification**: Creates SHA-256 checksums
- **Rotation**: Deletes backups older than retention period
- **S3 Upload**: Optional upload to AWS S3
- **Notifications**: Optional Slack notifications
- **Logging**: Colored output with INFO/WARN/ERROR levels

#### PostgreSQL Backup Process

```bash
# 1. Dump database
pg_dump "$DATABASE_URL" | gzip > backup_postgres_TIMESTAMP.sql.gz

# 2. Create checksum
sha256sum backup_postgres_TIMESTAMP.sql.gz > backup_postgres_TIMESTAMP.sql.gz.sha256

# 3. Rotate old backups
find backups/ -name "backup_*" -mtime +30 -delete

# 4. Upload to S3 (if configured)
aws s3 cp backup_postgres_TIMESTAMP.sql.gz s3://bucket/backups/
```

#### SQLite Backup Process

```bash
# 1. Backup database
sqlite3 dev.db ".backup 'backup_sqlite_TIMESTAMP.db'"

# 2. Compress
gzip backup_sqlite_TIMESTAMP.db

# 3. Create checksum
sha256sum backup_sqlite_TIMESTAMP.db.gz > backup_sqlite_TIMESTAMP.db.gz.sha256

# 4. Rotate and upload (same as PostgreSQL)
```

## Restore Procedures

### restore-database.sh

Located at `scripts/restore-database.sh`

#### Usage

```bash
# Basic usage
./scripts/restore-database.sh backups/backup_postgres_20251016_020000.sql.gz

# With custom database URL
DATABASE_URL="postgresql://..." \
./scripts/restore-database.sh backups/backup_postgres_20251016_020000.sql.gz
```

#### Safety Features

1. **Checksum Verification**: Validates backup integrity before restore
2. **Confirmation Prompt**: Requires explicit "yes" confirmation
3. **Safety Backup**: Creates backup of current database before restore
4. **Database Verification**: Tests database connectivity after restore
5. **Migration Sync**: Runs Prisma migrations after restore

#### Restore Process

```bash
# 1. Verify checksum (if available)
sha256sum -c backup.sql.gz.sha256

# 2. Confirm with user
read -p "Are you sure you want to continue? (yes/NO) "

# 3. Create safety backup
./scripts/backup-database.sh

# 4. Restore database
gunzip -c backup.sql.gz | psql "$DATABASE_URL"

# 5. Verify restoration
psql "$DATABASE_URL" -c "SELECT 1;"

# 6. Run migrations
npx prisma migrate deploy
```

#### PostgreSQL Restore

```bash
# Decompress and pipe to psql
gunzip -c backup_postgres_TIMESTAMP.sql.gz | psql "$DATABASE_URL"
```

#### SQLite Restore

```bash
# Decompress to temp file
gunzip -c backup_sqlite_TIMESTAMP.db.gz > /tmp/restore_temp.db

# Backup current database
mv dev.db dev.db.before_restore_TIMESTAMP

# Replace with restored database
mv /tmp/restore_temp.db dev.db
```

## Automation & Scheduling

### GitHub Actions (Recommended for Production)

Add to `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    # Daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual triggers

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install PostgreSQL client
        run: sudo apt-get install -y postgresql-client

      - name: Run backup
        run: ./scripts/backup-database.sh
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          BACKUP_S3_BUCKET: ${{ secrets.BACKUP_S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

      - name: Upload backup artifacts
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backups/
          retention-days: 30
```

### Cron Job (Alternative)

```bash
# Add to crontab (crontab -e)
0 2 * * * cd /path/to/app && ./scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

### Vercel Cron

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/backup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Then create API endpoint at `src/app/api/cron/backup/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { stdout, stderr } = await execAsync('./scripts/backup-database.sh');
    return NextResponse.json({ success: true, output: stdout });
  } catch (error) {
    return NextResponse.json(
      { error: 'Backup failed', details: error },
      { status: 500 }
    );
  }
}
```

## Monitoring & Alerts

### Backup Monitoring

The system provides multiple monitoring options:

#### 1. Slack Notifications

Set `SLACK_WEBHOOK_URL` to receive notifications:

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

Notifications include:
- Backup size
- Backup filename
- Timestamp
- Success/failure status

#### 2. GitHub Actions Notifications

GitHub Actions automatically sends notifications on:
- Workflow failures
- Successful completions
- Manual trigger results

#### 3. Log Monitoring

All backup operations are logged with:
- Colored output (INFO/WARN/ERROR)
- Timestamps
- Backup sizes
- Rotation statistics

Example log output:

```
[INFO] Starting database backup at 20251016_020000
[INFO] Detected PostgreSQL database
[INFO] Backing up PostgreSQL database...
[INFO] PostgreSQL backup created: backups/backup_postgres_20251016_020000.sql.gz
[INFO] Backup size: 45M
[INFO] Checksum created: backups/backup_postgres_20251016_020000.sql.gz.sha256
[INFO] Rotating old backups (keeping last 30 days)...
[INFO] Deleted 2 old backup(s)
[INFO] Total backups: 30
[INFO] Uploading backup to S3: s3://my-backups/
[INFO] Backup uploaded to S3 successfully
[INFO] Backup completed successfully!
```

### Health Checks

Use the health check API to monitor backup status:

```bash
curl https://miar-platform.com/api/health?detailed=true
```

## Best Practices

### 1. Test Restores Regularly

```bash
# Monthly restore test
./scripts/restore-database.sh backups/backup_postgres_LATEST.sql.gz
```

### 2. Verify Backups

Always verify checksums:

```bash
sha256sum -c backups/backup_postgres_TIMESTAMP.sql.gz.sha256
```

### 3. Multiple Storage Locations

Use both local and S3 storage:

```bash
export BACKUP_S3_BUCKET=my-backups
./scripts/backup-database.sh
```

### 4. Secure Backup Storage

- Encrypt S3 buckets
- Restrict IAM permissions
- Use private buckets
- Enable versioning

### 5. Document Procedures

Keep this documentation updated with:
- Restore test results
- Disaster recovery drills
- Incident post-mortems

### 6. Monitor Backup Size

Alert on unusual size changes:

```bash
# Compare with previous backup
PREV_SIZE=$(du -b backups/backup_postgres_$(date -d "yesterday" +%Y%m%d)* | cut -f1)
CURR_SIZE=$(du -b backups/backup_postgres_$(date +%Y%m%d)* | cut -f1)
DIFF=$((CURR_SIZE - PREV_SIZE))
if [ $DIFF -gt 1000000000 ]; then
  echo "Warning: Backup size increased by >1GB"
fi
```

## Disaster Recovery

### Recovery Time Objective (RTO)

Target: **< 30 minutes**

### Recovery Point Objective (RPO)

Target: **< 24 hours** (daily backups)

### Disaster Recovery Steps

#### 1. Assess Situation

```bash
# Check database status
./scripts/restore-database.sh --dry-run

# Review recent backups
ls -lh backups/backup_* | tail -10
```

#### 2. Identify Recovery Point

```bash
# List available backups
ls -lh backups/

# Download from S3 if needed
aws s3 ls s3://my-backups/backups/
aws s3 cp s3://my-backups/backups/backup_TIMESTAMP.sql.gz ./
```

#### 3. Perform Restore

```bash
# Restore from backup
./scripts/restore-database.sh backups/backup_postgres_TIMESTAMP.sql.gz
```

#### 4. Verify Data Integrity

```bash
# Check critical data
npx prisma studio

# Run data validation queries
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM analyses;"
```

#### 5. Resume Operations

```bash
# Restart application
npm run build
npm start

# Monitor health
curl http://localhost:3000/api/health?detailed=true
```

### Emergency Contacts

- **DevOps Lead**: [Contact Info]
- **Database Admin**: [Contact Info]
- **On-Call Engineer**: [PagerDuty/Contact Info]

### Post-Incident Review

After any restore operation:

1. Document what happened
2. Update recovery procedures
3. Test backup/restore process
4. Review monitoring alerts
5. Improve automation

## Troubleshooting

### Common Issues

#### Backup Script Fails

```bash
# Check database connectivity
psql "$DATABASE_URL" -c "SELECT 1;"

# Check disk space
df -h

# Review logs
./scripts/backup-database.sh 2>&1 | tee backup.log
```

#### Restore Fails

```bash
# Verify backup integrity
gunzip -t backup.sql.gz

# Check checksum
sha256sum -c backup.sql.gz.sha256

# Test decompress
gunzip -c backup.sql.gz | head -10
```

#### S3 Upload Fails

```bash
# Check AWS credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://my-backups/

# Check bucket permissions
aws s3api get-bucket-policy --bucket my-backups
```

### Getting Help

- Review logs: Check backup script output
- Test manually: Run commands individually
- Contact support: Provide logs and error messages

## Related Documentation

- [CI/CD Pipeline](./.github/workflows/ci.yml)
- [Environment Configuration](./docs/ENVIRONMENT.md)
- [Security Scanning](./docs/SECURITY.md)
- [Monitoring Guide](./docs/MONITORING.md)
