const { Client } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_naQgGpd8jH4z@ep-red-morning-adxlme8k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

const migrationSQL = `
-- CreateTable
CREATE TABLE IF NOT EXISTS "PFASScanResult" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "systemType" TEXT NOT NULL,
    "totalPFAS" DOUBLE PRECISION NOT NULL,
    "pfoaLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pfosLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pfnaLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pfhxsLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "compoundsDetected" INTEGER NOT NULL,
    "compoundsAboveLimit" INTEGER NOT NULL DEFAULT 0,
    "overallRiskLevel" TEXT NOT NULL,
    "overallRiskScore" DOUBLE PRECISION NOT NULL,
    "complianceStatus" TEXT NOT NULL,
    "urgencyLevel" TEXT NOT NULL,
    "projectedLifeMonths" DOUBLE PRECISION NOT NULL,
    "removalEfficiency" DOUBLE PRECISION NOT NULL,
    "costPerMG" DOUBLE PRECISION NOT NULL,
    "estimatedFines" TEXT,
    "fullReport" TEXT NOT NULL,
    "htmlReport" TEXT,
    "textSummary" TEXT,
    "overallConfidence" DOUBLE PRECISION NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "emailError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "PFASScanResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PFASValidationData" (
    "id" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "systemId" TEXT,
    "studyDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "observedCapacity" DOUBLE PRECISION,
    "observedLifespan" DOUBLE PRECISION,
    "breakthroughData" TEXT NOT NULL,
    "modelR2" DOUBLE PRECISION,
    "modelRMSE" DOUBLE PRECISION,
    "predictionAccuracy" TEXT,
    "dataQuality" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PFASValidationData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PFASScanResult_scanId_key" ON "PFASScanResult"("scanId");
CREATE INDEX IF NOT EXISTS "PFASScanResult_scanId_idx" ON "PFASScanResult"("scanId");
CREATE INDEX IF NOT EXISTS "PFASScanResult_email_idx" ON "PFASScanResult"("email");
CREATE INDEX IF NOT EXISTS "PFASScanResult_facilityName_idx" ON "PFASScanResult"("facilityName");
CREATE INDEX IF NOT EXISTS "PFASScanResult_createdAt_idx" ON "PFASScanResult"("createdAt");
CREATE INDEX IF NOT EXISTS "PFASScanResult_email_createdAt_idx" ON "PFASScanResult"("email", "createdAt");
CREATE INDEX IF NOT EXISTS "PFASScanResult_overallRiskLevel_createdAt_idx" ON "PFASScanResult"("overallRiskLevel", "createdAt");
CREATE INDEX IF NOT EXISTS "PFASScanResult_complianceStatus_idx" ON "PFASScanResult"("complianceStatus");
CREATE INDEX IF NOT EXISTS "PFASScanResult_urgencyLevel_createdAt_idx" ON "PFASScanResult"("urgencyLevel", "createdAt");
CREATE INDEX IF NOT EXISTS "PFASScanResult_expiresAt_idx" ON "PFASScanResult"("expiresAt");
CREATE INDEX IF NOT EXISTS "PFASValidationData_facilityName_idx" ON "PFASValidationData"("facilityName");
CREATE INDEX IF NOT EXISTS "PFASValidationData_systemId_idx" ON "PFASValidationData"("systemId");
CREATE INDEX IF NOT EXISTS "PFASValidationData_studyDate_idx" ON "PFASValidationData"("studyDate");
CREATE INDEX IF NOT EXISTS "PFASValidationData_dataQuality_idx" ON "PFASValidationData"("dataQuality");
`;

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();

    console.log('📦 Running PFAS migration...');
    await client.query(migrationSQL);

    console.log('✅ PFAS tables created successfully!');
    console.log('   - PFASScanResult');
    console.log('   - PFASValidationData');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration();
