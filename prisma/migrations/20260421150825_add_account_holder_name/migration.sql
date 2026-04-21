/*
  Warnings:

  - Added the required column `accountHolderName` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "accountHolderName" TEXT NOT NULL;
