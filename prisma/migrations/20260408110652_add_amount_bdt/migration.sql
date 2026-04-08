/*
  Warnings:

  - Made the column `amountBDT` on table `Deposit` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Deposit" ALTER COLUMN "amountBDT" SET NOT NULL;
