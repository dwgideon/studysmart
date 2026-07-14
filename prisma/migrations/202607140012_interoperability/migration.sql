ALTER TABLE "Concept" ADD COLUMN "academicStandardId" UUID;

CREATE TABLE "AcademicStandard" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "framework" TEXT NOT NULL, "version" TEXT NOT NULL,
  "code" TEXT NOT NULL, "uri" TEXT, "title" TEXT NOT NULL, "description" TEXT, "gradeBand" TEXT,
  "subject" TEXT, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "AcademicStandard_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StandardAssociation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "sourceId" UUID NOT NULL, "targetId" UUID NOT NULL,
  "type" TEXT NOT NULL, "metadata" JSONB, CONSTRAINT "StandardAssociation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "IntegrationConnection" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "ownerUserId" UUID NOT NULL, "type" TEXT NOT NULL,
  "name" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'ACTIVE', "config" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ExternalMapping" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "integrationId" UUID NOT NULL, "entityType" TEXT NOT NULL,
  "externalId" TEXT NOT NULL, "internalId" TEXT NOT NULL, "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalMapping_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LtiDeployment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "integrationId" UUID NOT NULL, "issuer" TEXT NOT NULL,
  "clientId" TEXT NOT NULL, "deploymentId" TEXT NOT NULL, "authLoginUrl" TEXT NOT NULL,
  "authTokenUrl" TEXT, "jwksUrl" TEXT NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LtiDeployment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LtiLaunchState" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "deploymentId" UUID NOT NULL, "stateHash" TEXT NOT NULL,
  "nonceHash" TEXT NOT NULL, "targetLinkUri" TEXT NOT NULL, "loginHint" TEXT, "messageHint" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL, "usedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LtiLaunchState_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LtiLaunch" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "deploymentId" UUID NOT NULL, "subjectHash" TEXT NOT NULL,
  "contextId" TEXT, "resourceLinkId" TEXT, "roles" JSONB NOT NULL, "claims" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "LtiLaunch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademicStandard_framework_version_code_key" ON "AcademicStandard"("framework", "version", "code");
CREATE INDEX "AcademicStandard_subject_gradeBand_idx" ON "AcademicStandard"("subject", "gradeBand");
CREATE UNIQUE INDEX "StandardAssociation_sourceId_targetId_type_key" ON "StandardAssociation"("sourceId", "targetId", "type");
CREATE INDEX "StandardAssociation_targetId_type_idx" ON "StandardAssociation"("targetId", "type");
CREATE UNIQUE INDEX "IntegrationConnection_ownerUserId_type_name_key" ON "IntegrationConnection"("ownerUserId", "type", "name");
CREATE INDEX "IntegrationConnection_type_status_idx" ON "IntegrationConnection"("type", "status");
CREATE UNIQUE INDEX "ExternalMapping_integrationId_entityType_externalId_key" ON "ExternalMapping"("integrationId", "entityType", "externalId");
CREATE INDEX "ExternalMapping_entityType_internalId_idx" ON "ExternalMapping"("entityType", "internalId");
CREATE UNIQUE INDEX "LtiDeployment_issuer_clientId_deploymentId_key" ON "LtiDeployment"("issuer", "clientId", "deploymentId");
CREATE INDEX "LtiDeployment_integrationId_active_idx" ON "LtiDeployment"("integrationId", "active");
CREATE UNIQUE INDEX "LtiLaunchState_stateHash_key" ON "LtiLaunchState"("stateHash");
CREATE INDEX "LtiLaunchState_expiresAt_usedAt_idx" ON "LtiLaunchState"("expiresAt", "usedAt");
CREATE INDEX "LtiLaunch_deploymentId_createdAt_idx" ON "LtiLaunch"("deploymentId", "createdAt");
CREATE INDEX "LtiLaunch_subjectHash_idx" ON "LtiLaunch"("subjectHash");
CREATE INDEX "Concept_academicStandardId_idx" ON "Concept"("academicStandardId");

ALTER TABLE "Concept" ADD CONSTRAINT "Concept_academicStandardId_fkey" FOREIGN KEY ("academicStandardId") REFERENCES "AcademicStandard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StandardAssociation" ADD CONSTRAINT "StandardAssociation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "AcademicStandard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StandardAssociation" ADD CONSTRAINT "StandardAssociation_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "AcademicStandard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalMapping" ADD CONSTRAINT "ExternalMapping_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LtiDeployment" ADD CONSTRAINT "LtiDeployment_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LtiLaunchState" ADD CONSTRAINT "LtiLaunchState_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "LtiDeployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LtiLaunch" ADD CONSTRAINT "LtiLaunch_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "LtiDeployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
