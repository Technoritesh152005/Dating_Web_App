CREATE TYPE "ScamRiskLevel" AS ENUM ('HIGH');

CREATE TABLE "scam_risk_flags" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "risk" "ScamRiskLevel" NOT NULL,
  "confidence" TEXT,
  "signals" TEXT[] NOT NULL,
  "explanation" TEXT,
  "dismissedByUserA" BOOLEAN NOT NULL DEFAULT false,
  "dismissedByUserB" BOOLEAN NOT NULL DEFAULT false,
  "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "scam_risk_flags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "scam_risk_flags_matchId_key"
ON "scam_risk_flags"("matchId");

ALTER TABLE "scam_risk_flags"
ADD CONSTRAINT "scam_risk_flags_matchId_fkey"
FOREIGN KEY ("matchId") REFERENCES "matches"("id")
ON DELETE CASCADE ON UPDATE CASCADE;