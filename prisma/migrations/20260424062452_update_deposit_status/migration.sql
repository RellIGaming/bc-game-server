/*
  Warnings:

  - The values [SUBMITTED] on the enum `DepositStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DepositStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "Deposit" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Deposit" ALTER COLUMN "status" TYPE "DepositStatus_new" USING ("status"::text::"DepositStatus_new");
ALTER TYPE "DepositStatus" RENAME TO "DepositStatus_old";
ALTER TYPE "DepositStatus_new" RENAME TO "DepositStatus";
DROP TYPE "DepositStatus_old";
ALTER TABLE "Deposit" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
