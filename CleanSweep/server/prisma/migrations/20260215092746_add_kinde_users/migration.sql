/*
  Warnings:

  - Added the required column `userId` to the `cloud_accounts` table without a default value. This is not possible if the table is not empty.

*/

-- CreateTable (create users table first)
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Insert a default user for existing accounts (if any exist)
-- This user will be replaced when the actual user logs in
INSERT INTO "users" ("id", "email", "name", "createdAt", "updatedAt")
SELECT 'default-user-migration', 'migration@cleansweep.local', 'Migration User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "cloud_accounts" LIMIT 1);

-- AlterTable (add userId column as nullable first)
ALTER TABLE "cloud_accounts" ADD COLUMN "userId" TEXT;

-- Update existing records to use the default user
UPDATE "cloud_accounts" SET "userId" = 'default-user-migration' WHERE "userId" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "cloud_accounts" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex (for userId on cloud_accounts)
CREATE INDEX "cloud_accounts_userId_idx" ON "cloud_accounts"("userId");

-- AddForeignKey
ALTER TABLE "cloud_accounts" ADD CONSTRAINT "cloud_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
