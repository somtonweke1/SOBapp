-- CreateTable
CREATE TABLE "PFASScanResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanId" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "systemType" TEXT NOT NULL,
    "totalPFAS" REAL NOT NULL,
    "pfoaLevel" REAL NOT NULL DEFAULT 0,
    "pfosLevel" REAL NOT NULL DEFAULT 0,
    "pfnaLevel" REAL NOT NULL DEFAULT 0,
    "pfhxsLevel" REAL NOT NULL DEFAULT 0,
    "compoundsDetected" INTEGER NOT NULL,
    "compoundsAboveLimit" INTEGER NOT NULL DEFAULT 0,
    "overallRiskLevel" TEXT NOT NULL,
    "overallRiskScore" REAL NOT NULL,
    "complianceStatus" TEXT NOT NULL,
    "urgencyLevel" TEXT NOT NULL,
    "projectedLifeMonths" REAL NOT NULL,
    "removalEfficiency" REAL NOT NULL,
    "costPerMG" REAL NOT NULL,
    "estimatedFines" TEXT,
    "fullReport" TEXT NOT NULL,
    "htmlReport" TEXT,
    "textSummary" TEXT,
    "overallConfidence" REAL NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" DATETIME,
    "emailError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME
);

-- CreateTable
CREATE TABLE "PFASValidationData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facilityName" TEXT NOT NULL,
    "systemId" TEXT,
    "studyDate" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "observedCapacity" REAL,
    "observedLifespan" REAL,
    "breakthroughData" TEXT NOT NULL,
    "modelR2" REAL,
    "modelRMSE" REAL,
    "predictionAccuracy" TEXT,
    "dataQuality" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PFASScanResult_scanId_key" ON "PFASScanResult"("scanId");

-- CreateIndex
CREATE INDEX "PFASScanResult_scanId_idx" ON "PFASScanResult"("scanId");

-- CreateIndex
CREATE INDEX "PFASScanResult_email_idx" ON "PFASScanResult"("email");

-- CreateIndex
CREATE INDEX "PFASScanResult_facilityName_idx" ON "PFASScanResult"("facilityName");

-- CreateIndex
CREATE INDEX "PFASScanResult_createdAt_idx" ON "PFASScanResult"("createdAt");

-- CreateIndex
CREATE INDEX "PFASScanResult_email_createdAt_idx" ON "PFASScanResult"("email", "createdAt");

-- CreateIndex
CREATE INDEX "PFASScanResult_overallRiskLevel_createdAt_idx" ON "PFASScanResult"("overallRiskLevel", "createdAt");

-- CreateIndex
CREATE INDEX "PFASScanResult_complianceStatus_idx" ON "PFASScanResult"("complianceStatus");

-- CreateIndex
CREATE INDEX "PFASScanResult_urgencyLevel_createdAt_idx" ON "PFASScanResult"("urgencyLevel", "createdAt");

-- CreateIndex
CREATE INDEX "PFASScanResult_expiresAt_idx" ON "PFASScanResult"("expiresAt");

-- CreateIndex
CREATE INDEX "PFASValidationData_facilityName_idx" ON "PFASValidationData"("facilityName");

-- CreateIndex
CREATE INDEX "PFASValidationData_systemId_idx" ON "PFASValidationData"("systemId");

-- CreateIndex
CREATE INDEX "PFASValidationData_studyDate_idx" ON "PFASValidationData"("studyDate");

-- CreateIndex
CREATE INDEX "PFASValidationData_dataQuality_idx" ON "PFASValidationData"("dataQuality");
