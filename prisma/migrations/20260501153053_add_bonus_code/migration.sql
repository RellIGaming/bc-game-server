-- CreateTable
CREATE TABLE "BonusCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "maxUsage" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BonusCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusRedemption" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "bonusId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BonusRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BonusCode_code_key" ON "BonusCode"("code");

-- CreateIndex
CREATE INDEX "BonusCode_code_idx" ON "BonusCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BonusRedemption_userId_bonusId_key" ON "BonusRedemption"("userId", "bonusId");

-- AddForeignKey
ALTER TABLE "BonusRedemption" ADD CONSTRAINT "BonusRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusRedemption" ADD CONSTRAINT "BonusRedemption_bonusId_fkey" FOREIGN KEY ("bonusId") REFERENCES "BonusCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
