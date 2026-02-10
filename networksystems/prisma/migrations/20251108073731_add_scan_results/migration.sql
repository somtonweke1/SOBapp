-- CreateTable
CREATE TABLE "ScanResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT,
    "totalRows" INTEGER NOT NULL,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "totalSuppliers" INTEGER NOT NULL,
    "clearSuppliers" INTEGER NOT NULL DEFAULT 0,
    "lowRiskSuppliers" INTEGER NOT NULL DEFAULT 0,
    "mediumRiskSuppliers" INTEGER NOT NULL DEFAULT 0,
    "highRiskSuppliers" INTEGER NOT NULL DEFAULT 0,
    "criticalSuppliers" INTEGER NOT NULL DEFAULT 0,
    "overallRiskLevel" TEXT NOT NULL,
    "overallRiskScore" REAL NOT NULL,
    "estimatedExposure" TEXT,
    "fullReport" TEXT NOT NULL,
    "htmlReport" TEXT NOT NULL,
    "textSummary" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" DATETIME,
    "emailError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "ScanResult_scanId_key" ON "ScanResult"("scanId");

-- CreateIndex
CREATE INDEX "ScanResult_scanId_idx" ON "ScanResult"("scanId");

-- CreateIndex
CREATE INDEX "ScanResult_email_idx" ON "ScanResult"("email");

-- CreateIndex
CREATE INDEX "ScanResult_companyName_idx" ON "ScanResult"("companyName");

-- CreateIndex
CREATE INDEX "ScanResult_createdAt_idx" ON "ScanResult"("createdAt");

-- CreateIndex
CREATE INDEX "ScanResult_email_createdAt_idx" ON "ScanResult"("email", "createdAt");

-- CreateIndex
CREATE INDEX "ScanResult_overallRiskLevel_createdAt_idx" ON "ScanResult"("overallRiskLevel", "createdAt");

-- CreateIndex
CREATE INDEX "ScanResult_expiresAt_idx" ON "ScanResult"("expiresAt");
