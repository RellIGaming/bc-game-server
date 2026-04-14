-- AlterTable
ALTER TABLE "users" ADD COLUMN     "usedReferralCode" VARCHAR(50);

-- CreateIndex
CREATE INDEX "users_usedReferralCode_idx" ON "users"("usedReferralCode");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
