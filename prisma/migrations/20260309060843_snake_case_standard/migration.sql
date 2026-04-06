/*
  Warnings:

  - The values [BONUS,BET,WIN] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `betType` on the `bets` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `bets` table. All the data in the column will be lost.
  - You are about to drop the column `marketId` on the `bets` table. All the data in the column will be lost.
  - You are about to drop the column `matchId` on the `bets` table. All the data in the column will be lost.
  - You are about to drop the column `oddsLocked` on the `bets` table. All the data in the column will be lost.
  - You are about to drop the column `optionId` on the `bets` table. All the data in the column will be lost.
  - You are about to drop the column `potentialWin` on the `bets` table. All the data in the column will be lost.
  - You are about to drop the column `settledAt` on the `bets` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `bets` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `bets` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(18,6)`.
  - You are about to alter the column `profit` on the `bets` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(18,6)`.
  - You are about to drop the column `createdAt` on the `market_options` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `market_options` table. All the data in the column will be lost.
  - You are about to drop the column `marketId` on the `market_options` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `markets` table. All the data in the column will be lost.
  - You are about to drop the column `matchId` on the `markets` table. All the data in the column will be lost.
  - You are about to drop the column `matchId` on the `match_liability` table. All the data in the column will be lost.
  - You are about to drop the column `optionId` on the `match_liability` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `match_liability` table. All the data in the column will be lost.
  - You are about to drop the column `totalPotentialWin` on the `match_liability` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `match_liability` table. All the data in the column will be lost.
  - You are about to alter the column `maxBetAmount` on the `risk_config` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(18,6)`.
  - You are about to alter the column `maxWinAmount` on the `risk_config` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(18,6)`.
  - You are about to alter the column `maxMatchLiability` on the `risk_config` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(18,6)`.
  - You are about to alter the column `maxUserDailyBet` on the `risk_config` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(18,6)`.
  - You are about to drop the column `balanceAfter` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `balanceBefore` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `idempotencyKey` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `referenceId` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `referenceType` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `wallet_transactions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,6)` to `Decimal(38,2)`.
  - You are about to drop the column `createdAt` on the `wallets` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `wallets` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `wallets` table. All the data in the column will be lost.
  - You are about to alter the column `balance` on the `wallets` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,6)` to `Decimal(38,2)`.
  - A unique constraint covering the columns `[idempotency_key]` on the table `bets` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[round_id,user_id]` on the table `crash_bets` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[match_id,option_id]` on the table `match_liability` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotency_key]` on the table `wallet_transactions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reference_id,type]` on the table `wallet_transactions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `wallets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `market_id` to the `bets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `match_id` to the `bets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `odds_locked` to the `bets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `option_id` to the `bets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `potential_win` to the `bets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `bets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gameType` to the `games` table without a default value. This is not possible if the table is not empty.
  - Made the column `players` on table `games` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `market_id` to the `market_options` table without a default value. This is not possible if the table is not empty.
  - Added the required column `match_id` to the `markets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `match_id` to the `match_liability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `option_id` to the `match_liability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `match_liability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `wallet_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `wallets` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('CRASH', 'DICE', 'SLOT', 'SPORTS');

-- CreateEnum
CREATE TYPE "CasinoBetStatus" AS ENUM ('PENDING', 'WON', 'LOST', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('RUNNING', 'CRASHED', 'FINISHED');

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('DEPOSIT', 'WITHDRAW', 'BET_DEBIT', 'BET_WIN', 'BET_REFUND');
ALTER TABLE "wallet_transactions" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "bets" DROP CONSTRAINT "bets_marketId_fkey";

-- DropForeignKey
ALTER TABLE "bets" DROP CONSTRAINT "bets_matchId_fkey";

-- DropForeignKey
ALTER TABLE "bets" DROP CONSTRAINT "bets_optionId_fkey";

-- DropForeignKey
ALTER TABLE "bets" DROP CONSTRAINT "bets_userId_fkey";

-- DropForeignKey
ALTER TABLE "market_options" DROP CONSTRAINT "market_options_marketId_fkey";

-- DropForeignKey
ALTER TABLE "markets" DROP CONSTRAINT "markets_matchId_fkey";

-- DropForeignKey
ALTER TABLE "match_liability" DROP CONSTRAINT "match_liability_optionId_fkey";

-- DropForeignKey
ALTER TABLE "wallet_transactions" DROP CONSTRAINT "wallet_transactions_userId_fkey";

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_userId_fkey";

-- DropIndex
DROP INDEX "bets_matchId_idx";

-- DropIndex
DROP INDEX "bets_optionId_idx";

-- DropIndex
DROP INDEX "bets_userId_idx";

-- DropIndex
DROP INDEX "crash_bets_round_id_status_idx";

-- DropIndex
DROP INDEX "market_options_marketId_idx";

-- DropIndex
DROP INDEX "markets_matchId_idx";

-- DropIndex
DROP INDEX "match_liability_matchId_optionId_key";

-- DropIndex
DROP INDEX "wallet_transactions_idempotencyKey_key";

-- DropIndex
DROP INDEX "wallet_transactions_userId_idx";

-- DropIndex
DROP INDEX "wallets_userId_key";

-- AlterTable
ALTER TABLE "bets" DROP COLUMN "betType",
DROP COLUMN "createdAt",
DROP COLUMN "marketId",
DROP COLUMN "matchId",
DROP COLUMN "oddsLocked",
DROP COLUMN "optionId",
DROP COLUMN "potentialWin",
DROP COLUMN "settledAt",
DROP COLUMN "userId",
ADD COLUMN     "bet_type" "BetType" NOT NULL DEFAULT 'SINGLE',
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "idempotency_key" VARCHAR(100),
ADD COLUMN     "market_id" BIGINT NOT NULL,
ADD COLUMN     "match_id" BIGINT NOT NULL,
ADD COLUMN     "odds_locked" DECIMAL(10,4) NOT NULL,
ADD COLUMN     "option_id" BIGINT NOT NULL,
ADD COLUMN     "potential_win" DECIMAL(18,6) NOT NULL,
ADD COLUMN     "settled_at" TIMESTAMP(3),
ADD COLUMN     "user_id" INTEGER NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,6),
ALTER COLUMN "profit" SET DATA TYPE DECIMAL(18,6);

-- AlterTable
ALTER TABLE "crash_rounds" ADD COLUMN     "gameId" BIGINT,
ADD COLUMN     "revealed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "games" ADD COLUMN     "gameType" "GameType" NOT NULL,
ALTER COLUMN "players" SET NOT NULL;

-- AlterTable
ALTER TABLE "market_options" DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "marketId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "market_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "markets" DROP COLUMN "createdAt",
DROP COLUMN "matchId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "match_id" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "match_liability" DROP COLUMN "matchId",
DROP COLUMN "optionId",
DROP COLUMN "totalAmount",
DROP COLUMN "totalPotentialWin",
DROP COLUMN "updatedAt",
ADD COLUMN     "match_id" BIGINT NOT NULL,
ADD COLUMN     "option_id" BIGINT NOT NULL,
ADD COLUMN     "total_amount" DECIMAL(18,6) NOT NULL DEFAULT 0,
ADD COLUMN     "total_potential_win" DECIMAL(18,6) NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "risk_config" ALTER COLUMN "maxBetAmount" SET DATA TYPE DECIMAL(18,6),
ALTER COLUMN "maxWinAmount" SET DATA TYPE DECIMAL(18,6),
ALTER COLUMN "maxMatchLiability" SET DATA TYPE DECIMAL(18,6),
ALTER COLUMN "maxUserDailyBet" SET DATA TYPE DECIMAL(18,6);

-- AlterTable
ALTER TABLE "wallet_transactions" DROP COLUMN "balanceAfter",
DROP COLUMN "balanceBefore",
DROP COLUMN "idempotencyKey",
DROP COLUMN "referenceId",
DROP COLUMN "referenceType",
DROP COLUMN "userId",
ADD COLUMN     "balance_after" DECIMAL(38,2),
ADD COLUMN     "balance_before" DECIMAL(38,2),
ADD COLUMN     "idempotency_key" VARCHAR(255),
ADD COLUMN     "reference_id" VARCHAR(100),
ADD COLUMN     "reference_type" VARCHAR(50),
ADD COLUMN     "user_id" INTEGER NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(38,2);

-- AlterTable
ALTER TABLE "wallets" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3),
ADD COLUMN     "user_id" INTEGER NOT NULL,
ALTER COLUMN "balance" SET DATA TYPE DECIMAL(38,2);

-- CreateTable
CREATE TABLE "dice_bets" (
    "id" BIGSERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "gameId" BIGINT,
    "amount" DECIMAL(18,6) NOT NULL,
    "target" DECIMAL(5,2) NOT NULL,
    "roll" DECIMAL(5,2),
    "multiplier" DECIMAL(10,4),
    "payout" DECIMAL(18,6),
    "status" "CasinoBetStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "dice_bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slot_spins" (
    "id" BIGSERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "gameId" BIGINT,
    "betAmount" DECIMAL(18,6) NOT NULL,
    "result" JSONB NOT NULL,
    "multiplier" DECIMAL(10,4),
    "payout" DECIMAL(18,6),
    "status" "CasinoBetStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "slot_spins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameConfig" (
    "id" SERIAL NOT NULL,
    "gameType" "GameType" NOT NULL,
    "houseEdge" DECIMAL(5,4) NOT NULL,
    "minBet" DECIMAL(18,6),
    "maxBet" DECIMAL(18,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameStats" (
    "id" SERIAL NOT NULL,
    "gameType" "GameType" NOT NULL,
    "totalWagered" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dice_bets_userId_idx" ON "dice_bets"("userId");

-- CreateIndex
CREATE INDEX "dice_bets_status_idx" ON "dice_bets"("status");

-- CreateIndex
CREATE INDEX "dice_bets_gameId_idx" ON "dice_bets"("gameId");

-- CreateIndex
CREATE INDEX "dice_bets_userId_createdAt_idx" ON "dice_bets"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "slot_spins_userId_idx" ON "slot_spins"("userId");

-- CreateIndex
CREATE INDEX "slot_spins_status_idx" ON "slot_spins"("status");

-- CreateIndex
CREATE INDEX "slot_spins_gameId_idx" ON "slot_spins"("gameId");

-- CreateIndex
CREATE INDEX "slot_spins_userId_createdAt_idx" ON "slot_spins"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GameConfig_gameType_key" ON "GameConfig"("gameType");

-- CreateIndex
CREATE UNIQUE INDEX "GameStats_gameType_key" ON "GameStats"("gameType");

-- CreateIndex
CREATE UNIQUE INDEX "bets_idempotency_key_key" ON "bets"("idempotency_key");

-- CreateIndex
CREATE INDEX "bets_user_id_idx" ON "bets"("user_id");

-- CreateIndex
CREATE INDEX "bets_match_id_idx" ON "bets"("match_id");

-- CreateIndex
CREATE INDEX "bets_option_id_idx" ON "bets"("option_id");

-- CreateIndex
CREATE INDEX "bets_user_id_created_at_idx" ON "bets"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "bets_status_created_at_idx" ON "bets"("status", "created_at");

-- CreateIndex
CREATE INDEX "crash_bets_round_id_idx" ON "crash_bets"("round_id");

-- CreateIndex
CREATE INDEX "crash_bets_status_idx" ON "crash_bets"("status");

-- CreateIndex
CREATE INDEX "crash_bets_user_id_created_at_idx" ON "crash_bets"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "crash_bets_round_id_user_id_key" ON "crash_bets"("round_id", "user_id");

-- CreateIndex
CREATE INDEX "crash_rounds_created_at_idx" ON "crash_rounds"("created_at");

-- CreateIndex
CREATE INDEX "crash_rounds_status_created_at_idx" ON "crash_rounds"("status", "created_at");

-- CreateIndex
CREATE INDEX "crash_rounds_gameId_idx" ON "crash_rounds"("gameId");

-- CreateIndex
CREATE INDEX "market_options_market_id_idx" ON "market_options"("market_id");

-- CreateIndex
CREATE INDEX "markets_match_id_idx" ON "markets"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_liability_match_id_option_id_key" ON "match_liability"("match_id", "option_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_idempotency_key_key" ON "wallet_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "wallet_transactions_created_at_idx" ON "wallet_transactions"("created_at");

-- CreateIndex
CREATE INDEX "wallet_transactions_user_id_idx" ON "wallet_transactions"("user_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_reference_id_type_idx" ON "wallet_transactions"("reference_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_reference_id_type_key" ON "wallet_transactions"("reference_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "markets" ADD CONSTRAINT "markets_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_options" ADD CONSTRAINT "market_options_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "market_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_liability" ADD CONSTRAINT "match_liability_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "market_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crash_rounds" ADD CONSTRAINT "crash_rounds_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dice_bets" ADD CONSTRAINT "dice_bets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dice_bets" ADD CONSTRAINT "dice_bets_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_spins" ADD CONSTRAINT "slot_spins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_spins" ADD CONSTRAINT "slot_spins_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;
