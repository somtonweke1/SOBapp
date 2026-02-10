-- CreateTable
CREATE TABLE "DiscoveredOwnership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityName" TEXT NOT NULL,
    "parentCompany" TEXT,
    "subsidiaries" TEXT NOT NULL DEFAULT '[]',
    "affiliates" TEXT NOT NULL DEFAULT '[]',
    "confidence" REAL NOT NULL,
    "dataQuality" TEXT NOT NULL,
    "sources" TEXT NOT NULL,
    "evidencePoints" TEXT NOT NULL DEFAULT '[]',
    "lastUpdated" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME
);

-- CreateTable
CREATE TABLE "DiscoveryJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "totalEntities" INTEGER NOT NULL,
    "processedEntities" INTEGER NOT NULL DEFAULT 0,
    "discoveredCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "coveragePercent" REAL,
    "results" TEXT,
    "errors" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveredOwnership_entityName_key" ON "DiscoveredOwnership"("entityName");

-- CreateIndex
CREATE INDEX "DiscoveredOwnership_entityName_idx" ON "DiscoveredOwnership"("entityName");

-- CreateIndex
CREATE INDEX "DiscoveredOwnership_parentCompany_idx" ON "DiscoveredOwnership"("parentCompany");

-- CreateIndex
CREATE INDEX "DiscoveredOwnership_confidence_idx" ON "DiscoveredOwnership"("confidence");

-- CreateIndex
CREATE INDEX "DiscoveredOwnership_dataQuality_idx" ON "DiscoveredOwnership"("dataQuality");

-- CreateIndex
CREATE INDEX "DiscoveredOwnership_lastUpdated_idx" ON "DiscoveredOwnership"("lastUpdated");

-- CreateIndex
CREATE INDEX "DiscoveredOwnership_verified_idx" ON "DiscoveredOwnership"("verified");

-- CreateIndex
CREATE INDEX "DiscoveryJob_status_idx" ON "DiscoveryJob"("status");

-- CreateIndex
CREATE INDEX "DiscoveryJob_type_idx" ON "DiscoveryJob"("type");

-- CreateIndex
CREATE INDEX "DiscoveryJob_startedAt_idx" ON "DiscoveryJob"("startedAt");
