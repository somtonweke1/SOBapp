#!/bin/bash

# StoneBridge Local Database Setup Script
# Sets up PostgreSQL + PostGIS for local GIS development

set -e

echo "========================================"
echo "StoneBridge Local Database Setup"
echo "========================================"

# Step 1: Start PostgreSQL service
echo ""
echo "[1/6] Starting PostgreSQL service..."
brew services start postgresql@15

# Wait for PostgreSQL to be ready
sleep 3

# Step 2: Create database
echo ""
echo "[2/6] Creating stonebridge database..."
createdb stonebridge || echo "Database may already exist"

# Step 3: Enable PostGIS extension
echo ""
echo "[3/6] Enabling PostGIS extension..."
psql stonebridge -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Step 4: Verify PostGIS
echo ""
echo "[4/6] Verifying PostGIS installation..."
psql stonebridge -c "SELECT PostGIS_Version();"

# Step 5: Run Prisma migrations
echo ""
echo "[5/6] Running Prisma migrations..."
export DATABASE_URL="postgresql://localhost:5432/stonebridge"
export DIRECT_URL="postgresql://localhost:5432/stonebridge"
npx prisma db push --accept-data-loss

# Step 6: Execute spatial migrations
echo ""
echo "[6/6] Executing spatial migrations..."
psql stonebridge -f prisma/migrations/20260410000000_add_spatial_support/migration.sql
psql stonebridge -f prisma/migrations/20260410000001_add_spatial_datasets/migration.sql

echo ""
echo "========================================"
echo "✅ Local database setup complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Update .env to use local database:"
echo "   DATABASE_URL=\"postgresql://localhost:5432/stonebridge\""
echo "2. Import Baltimore data:"
echo "   node scripts/importSpatialData.js"
echo "3. Run case studies:"
echo "   node scripts/runCaseStudies.js"
echo ""
