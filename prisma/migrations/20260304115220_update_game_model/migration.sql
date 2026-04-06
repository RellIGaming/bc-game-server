-- AlterTable
ALTER TABLE "games" ADD COLUMN     "players" INTEGER DEFAULT 0,
ADD COLUMN     "provider" VARCHAR(100);
