-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailOtp" TEXT,
ADD COLUMN     "emailOtpExpiry" TIMESTAMP(3),
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
