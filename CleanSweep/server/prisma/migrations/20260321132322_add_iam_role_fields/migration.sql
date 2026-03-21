-- AlterTable
ALTER TABLE "cloud_accounts" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "roleArn" TEXT,
ALTER COLUMN "accessKey" DROP NOT NULL,
ALTER COLUMN "secretKey" DROP NOT NULL;
