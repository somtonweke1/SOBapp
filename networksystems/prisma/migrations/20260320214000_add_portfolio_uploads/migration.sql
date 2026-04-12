-- CreateEnum
CREATE TYPE "PortfolioUploadStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'DELIVERED');

-- CreateEnum
CREATE TYPE "PortfolioDealContext" AS ENUM ('ACQUISITION_PIPELINE', 'EXISTING_PORTFOLIO', 'REHAB_PLANNING', 'NEIGHBORHOOD_ASSESSMENT');

-- CreateTable
CREATE TABLE "PortfolioUpload" (
    "id" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "addresses" TEXT[],
    "address_count" INTEGER NOT NULL,
    "deal_context" "PortfolioDealContext" NOT NULL,
    "status" "PortfolioUploadStatus" NOT NULL DEFAULT 'RECEIVED',
    "reference_number" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "results_json" TEXT,
    "generated_at" TIMESTAMP(3),

    CONSTRAINT "PortfolioUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioUpload_reference_number_key" ON "PortfolioUpload"("reference_number");

-- CreateIndex
CREATE INDEX "PortfolioUpload_status_submitted_at_idx" ON "PortfolioUpload"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "PortfolioUpload_institution_name_submitted_at_idx" ON "PortfolioUpload"("institution_name", "submitted_at");

-- CreateIndex
CREATE INDEX "PortfolioUpload_reference_number_idx" ON "PortfolioUpload"("reference_number");
