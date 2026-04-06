/*
  Warnings:

  - The values [CONFIRMED] on the enum `DepositStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [COMPLETED] on the enum `WithdrawalStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `address` on the `Withdrawal` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orderId]` on the table `Deposit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderId]` on the table `Withdrawal` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,currency]` on the table `wallets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `method` to the `Deposit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderId` to the `Deposit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Deposit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `method` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderId` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `wallet_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `wallets` table without a default value. This is not possible if the table is not empty.

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

-- AlterEnum
BEGIN;
CREATE TYPE "WithdrawalStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "Withdrawal" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Withdrawal" ALTER COLUMN "status" TYPE "WithdrawalStatus_new" USING ("status"::text::"WithdrawalStatus_new");
ALTER TYPE "WithdrawalStatus" RENAME TO "WithdrawalStatus_old";
ALTER TYPE "WithdrawalStatus_new" RENAME TO "WithdrawalStatus";
DROP TYPE "WithdrawalStatus_old";
ALTER TABLE "Withdrawal" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "Deposit_txHash_key";

-- DropIndex
DROP INDEX "wallets_user_id_key";

-- AlterTable
ALTER TABLE "Deposit" ADD COLUMN     "agentId" INTEGER,
ADD COLUMN     "method" TEXT NOT NULL,
ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "proof" TEXT,
ADD COLUMN     "txId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "network" DROP NOT NULL,
ALTER COLUMN "txHash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Withdrawal" DROP COLUMN "address",
ADD COLUMN     "account" TEXT NOT NULL,
ADD COLUMN     "agentId" INTEGER,
ADD COLUMN     "method" TEXT NOT NULL,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "wallet_transactions" ADD COLUMN     "currency" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "bonus" DECIMAL(38,2) NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "icon_url" TEXT,
ADD COLUMN     "is_locked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" INTEGER,
    "agentId" INTEGER,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportReply" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_orderId_key" ON "Deposit"("orderId");

-- CreateIndex
CREATE INDEX "Deposit_userId_idx" ON "Deposit"("userId");

-- CreateIndex
CREATE INDEX "Deposit_agentId_idx" ON "Deposit"("agentId");

-- CreateIndex
CREATE INDEX "Deposit_status_idx" ON "Deposit"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Withdrawal_orderId_key" ON "Withdrawal"("orderId");

-- CreateIndex
CREATE INDEX "Withdrawal_userId_idx" ON "Withdrawal"("userId");

-- CreateIndex
CREATE INDEX "Withdrawal_agentId_idx" ON "Withdrawal"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_currency_key" ON "wallets"("user_id", "currency");

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportReply" ADD CONSTRAINT "SupportReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
