/*
  Warnings:

  - A unique constraint covering the columns `[userId,currency]` on the table `Vault` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `currency` to the `Vault` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Vault` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vault" ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Vault_userId_currency_key" ON "Vault"("userId", "currency");
