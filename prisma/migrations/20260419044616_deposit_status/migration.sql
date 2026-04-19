-- AlterEnum
ALTER TYPE "DepositStatus" ADD VALUE 'SUBMITTED';

-- AlterTable
ALTER TABLE "Deposit" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "submittedAt" TIMESTAMP(3);
