-- Add the missing lookingFor array column to the preferences table.
-- This matches the Prisma Preference model in schema.prisma.

ALTER TABLE "preferences"
ADD COLUMN IF NOT EXISTS "lookingFor" TEXT[] NOT NULL DEFAULT '{}';
