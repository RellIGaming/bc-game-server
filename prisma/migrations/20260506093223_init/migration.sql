/*
  Warnings:

  - You are about to alter the column `prizePool` on the `DailyContest` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `wager` on the `DailyContestHistory` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `prize` on the `DailyContestHistory` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `wager` on the `DailyContestLeaderboard` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `prize` on the `DailyContestLeaderboard` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `rate` on the `ExchangeRate` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,6)`.
  - You are about to alter the column `totalWager` on the `ReferralProgress` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `unlocked` on the `ReferralProgress` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - You are about to alter the column `wagered` on the `Rollover` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - You are about to alter the column `required` on the `Rollover` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,2)`.
  - The `reference_type` column on the `wallet_transactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `BonusCode` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `source` to the `Rollover` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `senderId` on the `SupportReply` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `SupportTicket` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `VaultTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BonusType" AS ENUM ('FIXED', 'PERCENT');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('BONUS', 'REFERRAL', 'DAILY_BONUS', 'RAKEBACK', 'BONUS_CODE');

-- AlterTable
ALTER TABLE "BonusCode" DROP COLUMN "type",
ADD COLUMN     "type" "BonusType" NOT NULL;

-- AlterTable
ALTER TABLE "BonusRedemption" ADD COLUMN     "amount" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "DailyContest" ALTER COLUMN "prizePool" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "DailyContestHistory" ALTER COLUMN "wager" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "prize" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "DailyContestLeaderboard" ALTER COLUMN "wager" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "prize" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "ExchangeRate" ALTER COLUMN "rate" SET DATA TYPE DECIMAL(18,6);

-- AlterTable
ALTER TABLE "ReferralProgress" ALTER COLUMN "totalWager" DROP DEFAULT,
ALTER COLUMN "totalWager" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "unlocked" DROP DEFAULT,
ALTER COLUMN "unlocked" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "Rollover" ADD COLUMN     "bonusId" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" "ReferenceType" NOT NULL,
ALTER COLUMN "wagered" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "required" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "SupportReply" DROP COLUMN "senderId",
ADD COLUMN     "senderId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SupportTicket" DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "VaultTransaction" DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "wallet_transactions" DROP COLUMN "reference_type",
ADD COLUMN     "reference_type" "ReferenceType";

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "lockedAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallet_transactions_user_id_reference_type_idx" ON "wallet_transactions"("user_id", "reference_type");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudLog" ADD CONSTRAINT "FraudLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultTransaction" ADD CONSTRAINT "VaultTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
