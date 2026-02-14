-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('AWS', 'AZURE', 'GCP');

-- CreateTable
CREATE TABLE "CloudAccount" (
    "id" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "accessKey" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudAccount_pkey" PRIMARY KEY ("id")
);
