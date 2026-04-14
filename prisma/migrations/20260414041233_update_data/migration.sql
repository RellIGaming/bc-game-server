/*
  Warnings:

  - You are about to drop the column `usedReferralCode` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_usedReferralCode_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "usedReferralCode",
ADD COLUMN     "used_referral_code" TEXT;

-- CreateTable
CREATE TABLE "CommissionRule" (
    "id" SERIAL NOT NULL,
    "gameType" TEXT NOT NULL,
    "rate" INTEGER NOT NULL,

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralProgress" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "friendId" INTEGER NOT NULL,
    "totalWager" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unlocked" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ReferralProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "badge" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "categories" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyContest" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Daily Contest',
    "prizePool" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyContest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyContestLeaderboard" (
    "id" SERIAL NOT NULL,
    "contestId" INTEGER NOT NULL,
    "userId" INTEGER,
    "playerName" TEXT NOT NULL,
    "wager" DOUBLE PRECISION NOT NULL,
    "prize" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "DailyContestLeaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyContestHistory" (
    "id" SERIAL NOT NULL,
    "contestId" INTEGER NOT NULL,
    "playerName" TEXT NOT NULL,
    "wager" DOUBLE PRECISION NOT NULL,
    "prize" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyContestHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyContestRule" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "DailyContestRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyContestCurrency" (
    "id" SERIAL NOT NULL,
    "groupText" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "DailyContestCurrency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_bonus_tiers" (
    "id" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "minAmount" DECIMAL(18,2) NOT NULL,
    "maxBonus" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposit_bonus_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleRound" (
    "id" SERIAL NOT NULL,
    "roundId" TEXT NOT NULL,
    "prizePool" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalTickets" INTEGER NOT NULL DEFAULT 0,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "drawAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaffleRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleTicket" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roundId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "wagerAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "prize" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaffleTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleWinner" (
    "id" SERIAL NOT NULL,
    "roundId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "ticketNo" TEXT NOT NULL,
    "prize" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaffleWinner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyContestLeaderboard_contestId_idx" ON "DailyContestLeaderboard"("contestId");

-- CreateIndex
CREATE UNIQUE INDEX "RaffleRound_roundId_key" ON "RaffleRound"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "RaffleTicket_ticketNumber_key" ON "RaffleTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "RaffleTicket_userId_idx" ON "RaffleTicket"("userId");

-- CreateIndex
CREATE INDEX "RaffleTicket_roundId_idx" ON "RaffleTicket"("roundId");

-- CreateIndex
CREATE INDEX "RaffleWinner_roundId_idx" ON "RaffleWinner"("roundId");

-- CreateIndex
CREATE INDEX "users_referred_by_idx" ON "users"("referred_by");

-- CreateIndex
CREATE INDEX "users_referral_code_idx" ON "users"("referral_code");

-- CreateIndex
CREATE INDEX "users_used_referral_code_idx" ON "users"("used_referral_code");

-- AddForeignKey
ALTER TABLE "DailyContestLeaderboard" ADD CONSTRAINT "DailyContestLeaderboard_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "DailyContest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyContestHistory" ADD CONSTRAINT "DailyContestHistory_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "DailyContest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleTicket" ADD CONSTRAINT "RaffleTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleTicket" ADD CONSTRAINT "RaffleTicket_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "RaffleRound"("roundId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleWinner" ADD CONSTRAINT "RaffleWinner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
