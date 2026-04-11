/*
  Warnings:

  - A unique constraint covering the columns `[txId]` on the table `wallet_transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "wallet_transactions" ADD COLUMN     "txId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_txId_key" ON "wallet_transactions"("txId");
