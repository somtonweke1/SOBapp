-- CreateIndex
CREATE INDEX "Analysis_userId_status_idx" ON "Analysis"("userId", "status");

-- CreateIndex
CREATE INDEX "Analysis_networkId_status_idx" ON "Analysis"("networkId", "status");

-- CreateIndex
CREATE INDEX "Analysis_userId_createdAt_idx" ON "Analysis"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Analysis_status_createdAt_idx" ON "Analysis"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ApiKey_userId_isActive_idx" ON "ApiKey"("userId", "isActive");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_expiresAt_idx" ON "ApiKey"("isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_action_timestamp_idx" ON "AuditLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_resource_timestamp_idx" ON "AuditLog"("resource", "timestamp");

-- CreateIndex
CREATE INDEX "ExportLog_userId_timestamp_idx" ON "ExportLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "ExportLog_exportType_timestamp_idx" ON "ExportLog"("exportType", "timestamp");

-- CreateIndex
CREATE INDEX "GeopoliticalEvent_country_publishedAt_idx" ON "GeopoliticalEvent"("country", "publishedAt");

-- CreateIndex
CREATE INDEX "GeopoliticalEvent_region_publishedAt_idx" ON "GeopoliticalEvent"("region", "publishedAt");

-- CreateIndex
CREATE INDEX "GeopoliticalEvent_severity_publishedAt_idx" ON "GeopoliticalEvent"("severity", "publishedAt");

-- CreateIndex
CREATE INDEX "GeopoliticalEvent_eventType_publishedAt_idx" ON "GeopoliticalEvent"("eventType", "publishedAt");

-- CreateIndex
CREATE INDEX "Network_userId_updatedAt_idx" ON "Network"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Network_userId_createdAt_idx" ON "Network"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RiskAlert_category_createdAt_idx" ON "RiskAlert"("category", "createdAt");

-- CreateIndex
CREATE INDEX "RiskAlert_resolved_createdAt_idx" ON "RiskAlert"("resolved", "createdAt");

-- CreateIndex
CREATE INDEX "RiskAlert_severity_createdAt_idx" ON "RiskAlert"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "Scenario_userId_status_idx" ON "Scenario"("userId", "status");

-- CreateIndex
CREATE INDEX "Scenario_userId_createdAt_idx" ON "Scenario"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Scenario_type_status_idx" ON "Scenario"("type", "status");

-- CreateIndex
CREATE INDEX "Scenario_status_createdAt_idx" ON "Scenario"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Session_userId_expires_idx" ON "Session"("userId", "expires");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "Session"("expires");

-- CreateIndex
CREATE INDEX "User_subscription_idx" ON "User"("subscription");

-- CreateIndex
CREATE INDEX "User_isActive_role_idx" ON "User"("isActive", "role");
