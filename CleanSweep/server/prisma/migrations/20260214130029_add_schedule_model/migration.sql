/*
  Warnings:

  - You are about to drop the `CloudAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ScanResult" DROP CONSTRAINT "ScanResult_accountId_fkey";

-- DropTable
DROP TABLE "CloudAccount";

-- CreateTable
CREATE TABLE "cloud_accounts" (
    "id" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "accessKey" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cloud_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "stopTime" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedules_accountId_idx" ON "schedules"("accountId");

-- CreateIndex
CREATE INDEX "schedules_isEnabled_idx" ON "schedules"("isEnabled");

-- AddForeignKey
ALTER TABLE "ScanResult" ADD CONSTRAINT "ScanResult_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "cloud_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "cloud_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
