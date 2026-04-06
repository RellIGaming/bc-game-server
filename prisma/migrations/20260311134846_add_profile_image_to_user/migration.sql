-- AlterTable
ALTER TABLE "users" ADD COLUMN     "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "profile_image" VARCHAR(255);
