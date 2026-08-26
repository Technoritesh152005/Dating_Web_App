ALTER TABLE "matches"
ADD COLUMN "scamAnalysisConsentA" BOOLEAN,
ADD COLUMN "scamAnalysisConsentB" BOOLEAN,
ADD COLUMN "scamAnalysisConsentAtA" TIMESTAMP(3),
ADD COLUMN "scamAnalysisConsentAtB" TIMESTAMP(3);