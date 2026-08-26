ALTER TABLE "profiles"
ADD COLUMN "username" TEXT;

CREATE UNIQUE INDEX "profiles_username_key"
ON "profiles" ("username");

