-- CreateEnum
CREATE TYPE "OutreachStatus" AS ENUM ('NEW', 'PACKET_GENERATED', 'MAILED', 'FOLLOW_UP', 'CLOSED');

-- CreateTable
CREATE TABLE "TargetStatus" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "normalizedAddress" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "status" "OutreachStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "packetGeneratedAt" TIMESTAMP(3),
    "mailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "target_status_unique" ON "TargetStatus"("normalizedAddress", "zipCode");

-- CreateIndex
CREATE INDEX "TargetStatus_zipCode_status_idx" ON "TargetStatus"("zipCode", "status");

-- CreateIndex
CREATE INDEX "TargetStatus_updatedAt_idx" ON "TargetStatus"("updatedAt");
