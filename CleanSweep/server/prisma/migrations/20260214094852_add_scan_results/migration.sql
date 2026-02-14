-- CreateTable
CREATE TABLE "ScanResult" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL DEFAULT 'EBS',
    "sizeGb" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "monthlyCost" DOUBLE PRECISION NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScanResult" ADD CONSTRAINT "ScanResult_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CloudAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
