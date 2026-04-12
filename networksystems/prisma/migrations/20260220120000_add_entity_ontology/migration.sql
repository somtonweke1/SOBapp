-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ProcurementMethodType" AS ENUM ('EMERGENCY', 'SOLE_SOURCE', 'COMPETITIVE', 'EXPEDITED', 'SMALL_PROCUREMENT', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "RiskBasisType" AS ENUM ('STRICT_LAW', 'RISK_HEURISTIC');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "GovernmentAgency" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "jurisdiction" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GovernmentAgency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MasterEntity" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MasterEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EntityAlias" (
  "id" TEXT NOT NULL,
  "alias" TEXT NOT NULL,
  "normalizedAlias" TEXT NOT NULL,
  "masterEntityId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EntityAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Statute" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "bodyText" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Statute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProcurementAction" (
  "id" TEXT NOT NULL,
  "externalId" TEXT,
  "agencyId" TEXT NOT NULL,
  "aliasId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "method" "ProcurementMethodType" NOT NULL,
  "category" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "waiverGranted" BOOLEAN NOT NULL DEFAULT false,
  "sourceUrl" TEXT NOT NULL,
  "boardActionDate" TIMESTAMP(3),
  "vendorAddress" TEXT,
  "vendorPhone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProcurementAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RiskDossier" (
  "id" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "masterEntityId" TEXT,
  "statuteId" TEXT,
  "agencyName" TEXT NOT NULL,
  "basis" "RiskBasisType" NOT NULL,
  "indicator" TEXT NOT NULL,
  "exposure" DOUBLE PRECISION NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "defensibilityScore" DOUBLE PRECISION NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RiskDossier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "GovernmentAgency_name_key" ON "GovernmentAgency"("name");
CREATE INDEX IF NOT EXISTS "GovernmentAgency_jurisdiction_idx" ON "GovernmentAgency"("jurisdiction");

CREATE UNIQUE INDEX IF NOT EXISTS "MasterEntity_name_key" ON "MasterEntity"("name");

CREATE INDEX IF NOT EXISTS "EntityAlias_masterEntityId_idx" ON "EntityAlias"("masterEntityId");
CREATE INDEX IF NOT EXISTS "EntityAlias_normalizedAlias_idx" ON "EntityAlias"("normalizedAlias");
CREATE UNIQUE INDEX IF NOT EXISTS "EntityAlias_masterEntityId_normalizedAlias_key" ON "EntityAlias"("masterEntityId", "normalizedAlias");

CREATE UNIQUE INDEX IF NOT EXISTS "Statute_code_key" ON "Statute"("code");

CREATE UNIQUE INDEX IF NOT EXISTS "ProcurementAction_externalId_key" ON "ProcurementAction"("externalId");
CREATE INDEX IF NOT EXISTS "ProcurementAction_agencyId_method_idx" ON "ProcurementAction"("agencyId", "method");
CREATE INDEX IF NOT EXISTS "ProcurementAction_aliasId_boardActionDate_idx" ON "ProcurementAction"("aliasId", "boardActionDate");
CREATE INDEX IF NOT EXISTS "ProcurementAction_boardActionDate_idx" ON "ProcurementAction"("boardActionDate");
CREATE INDEX IF NOT EXISTS "ProcurementAction_vendorAddress_vendorPhone_idx" ON "ProcurementAction"("vendorAddress", "vendorPhone");

CREATE UNIQUE INDEX IF NOT EXISTS "RiskDossier_snapshotId_key" ON "RiskDossier"("snapshotId");
CREATE INDEX IF NOT EXISTS "RiskDossier_agencyName_basis_idx" ON "RiskDossier"("agencyName", "basis");
CREATE INDEX IF NOT EXISTS "RiskDossier_generatedAt_idx" ON "RiskDossier"("generatedAt");
CREATE INDEX IF NOT EXISTS "RiskDossier_defensibilityScore_idx" ON "RiskDossier"("defensibilityScore");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "EntityAlias"
  ADD CONSTRAINT "EntityAlias_masterEntityId_fkey"
  FOREIGN KEY ("masterEntityId") REFERENCES "MasterEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProcurementAction"
  ADD CONSTRAINT "ProcurementAction_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "GovernmentAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProcurementAction"
  ADD CONSTRAINT "ProcurementAction_aliasId_fkey"
  FOREIGN KEY ("aliasId") REFERENCES "EntityAlias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "RiskDossier"
  ADD CONSTRAINT "RiskDossier_masterEntityId_fkey"
  FOREIGN KEY ("masterEntityId") REFERENCES "MasterEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "RiskDossier"
  ADD CONSTRAINT "RiskDossier_statuteId_fkey"
  FOREIGN KEY ("statuteId") REFERENCES "Statute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
