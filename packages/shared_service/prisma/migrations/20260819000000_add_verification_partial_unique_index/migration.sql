-- Add partial unique index to prevent duplicate active verification requests
-- Only one PENDING or UNDER_REVIEW verification request per user at a time

CREATE UNIQUE INDEX IF NOT EXISTS "verification_requests_user_id_active_unique"
ON "verification_requests" ("userId")
WHERE "status" IN ('PENDING', 'UNDER_REVIEW');