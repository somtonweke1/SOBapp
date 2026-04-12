-- CreateEnum
CREATE TYPE "DealPropertyType" AS ENUM ('COMMERCIAL', 'RESIDENTIAL', 'MIXED', 'EXEMPT');

-- CreateEnum
CREATE TYPE "DealDecision" AS ENUM ('PROCEED', 'CAUTION', 'ESCALATE', 'INSUFFICIENT');

-- CreateEnum
CREATE TYPE "DealSubmittedBy" AS ENUM ('DEVELOPER', 'INSTITUTIONAL', 'ANONYMOUS');

-- CreateEnum
CREATE TYPE "PilotStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EngagementType" AS ENUM ('PILOT', 'MONTHLY_RETAINER', 'PER_DEAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ClientContractStatus" AS ENUM ('PILOT', 'ACTIVE', 'PAUSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "DealRecord" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "zip_code" TEXT,
    "neighborhood" TEXT,
    "property_type" "DealPropertyType",
    "zoning_code" TEXT,
    "land_use" TEXT,
    "assessment_value" INTEGER,
    "owner_name" TEXT,
    "permit_count" INTEGER NOT NULL DEFAULT 0,
    "permit_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active_violations" INTEGER NOT NULL DEFAULT 0,
    "violation_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vacant_notice" BOOLEAN NOT NULL DEFAULT false,
    "decision" "DealDecision" NOT NULL,
    "decision_drivers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "submitted_by" "DealSubmittedBy" NOT NULL DEFAULT 'ANONYMOUS',
    "institution_name" TEXT,
    "scan_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome_reported" BOOLEAN NOT NULL DEFAULT false,
    "outcome" TEXT,
    "outcome_reported_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "DealRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilotEngagement" (
    "id" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "pilot_start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pilot_status" "PilotStatus" NOT NULL DEFAULT 'ACTIVE',
    "deal_target" INTEGER NOT NULL,
    "deals_submitted" INTEGER NOT NULL DEFAULT 0,
    "deals_delivered" INTEGER NOT NULL DEFAULT 0,
    "feedback_collected" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "PilotEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PilotAccessToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PilotAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientEngagement" (
    "id" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "engagement_type" "EngagementType" NOT NULL,
    "monthly_fee" INTEGER,
    "per_deal_fee" INTEGER,
    "deal_volume_commitment" INTEGER,
    "contract_start_date" TIMESTAMP(3) NOT NULL,
    "contract_status" "ClientContractStatus" NOT NULL DEFAULT 'PILOT',
    "billing_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealRecord_scan_timestamp_idx" ON "DealRecord"("scan_timestamp");

-- CreateIndex
CREATE INDEX "DealRecord_decision_scan_timestamp_idx" ON "DealRecord"("decision", "scan_timestamp");

-- CreateIndex
CREATE INDEX "DealRecord_zip_code_scan_timestamp_idx" ON "DealRecord"("zip_code", "scan_timestamp");

-- CreateIndex
CREATE INDEX "DealRecord_property_type_scan_timestamp_idx" ON "DealRecord"("property_type", "scan_timestamp");

-- CreateIndex
CREATE INDEX "DealRecord_institution_name_scan_timestamp_idx" ON "DealRecord"("institution_name", "scan_timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "PilotEngagement_institution_name_key" ON "PilotEngagement"("institution_name");

-- CreateIndex
CREATE INDEX "PilotEngagement_pilot_status_idx" ON "PilotEngagement"("pilot_status");

-- CreateIndex
CREATE INDEX "PilotEngagement_pilot_start_date_idx" ON "PilotEngagement"("pilot_start_date");

-- CreateIndex
CREATE UNIQUE INDEX "PilotAccessToken_token_key" ON "PilotAccessToken"("token");

-- CreateIndex
CREATE INDEX "PilotAccessToken_institution_name_created_at_idx" ON "PilotAccessToken"("institution_name", "created_at");

-- CreateIndex
CREATE INDEX "ClientEngagement_institution_name_created_at_idx" ON "ClientEngagement"("institution_name", "created_at");

-- CreateIndex
CREATE INDEX "ClientEngagement_contract_status_created_at_idx" ON "ClientEngagement"("contract_status", "created_at");
