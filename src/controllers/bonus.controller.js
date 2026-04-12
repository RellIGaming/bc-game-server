import prisma from "../prisma.js";
// GET /api/bonus/dashboard
export const getBonusDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    /* ================= WALLETS ================= */

    const wallets = await prisma.wallet.findMany({
      where: { userId }
    });

    const totalBonus = wallets.reduce(
      (sum, w) => sum + Number(w.bonus || 0),
      0
    );

    /* ================= TRANSACTIONS ================= */

    const bonusTx = await prisma.walletTransaction.findMany({
      where: {
        userId,
        referenceType: "BONUS"
      }
    });

    const referralTx = await prisma.walletTransaction.findMany({
      where: {
        userId,
        referenceType: "REFERRAL"
      }
    });

    /* ================= CALCULATIONS ================= */

    const totalClaimed = [...bonusTx, ...referralTx].reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    );

    const referralBonus = referralTx.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    );

    const generalBonus = bonusTx.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    );

    /* ================= USER VIP ================= */

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        xp: true // you need this field
      }
    });

    const xp = user?.xp || 0;
    const vipLevel = Math.floor(xp / 100); // simple logic

    /* ================= RESPONSE ================= */

    res.json({
      summary: {
        totalClaimed,
        vipBonus: 0, // you can extend later
        specialBonus: 0,
        generalBonus,
        lockedBonus: totalBonus
      },

      vip: {
        level: vipLevel,
        xp,
        nextLevelXp: (vipLevel + 1) * 100
      },

      rakeback: {
        locked: 1,
        unlockRate: 20,
        ready: 0
      },

      quests: {
        daily: "0/3",
        weekly: "0/1"
      },

      challenge: {
        completed: 0,
        reward: 0
      },

      luckySpin: {
        vipSpin: "Reach VIP 8",
        dailySpin: 0
      },

      vault: {
        holdings: 0,
        returns: 0
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/bonus/daily
export const claimDailyBonus = async (req, res) => {
  try {
    const userId = req.user.id;
    const amount = 10;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyClaimed = await prisma.walletTransaction.findFirst({
      where: {
        userId,
        type: "DEPOSIT",
        referenceType: "DAILY_BONUS",
        createdAt: { gte: today }
      }
    });

    if (alreadyClaimed) {
      return res.status(400).json({ message: "Already claimed today" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.walletTransaction.create({
        data: {
          userId,
          currency: "INR",
          amount,
          type: "DEPOSIT",
          status: "COMPLETED",
          referenceType: "DAILY_BONUS"
        }
      });

      await tx.wallet.update({
        where: {
          userId_currency: { userId, currency: "INR" }
        },
        data: {
          bonus: { increment: amount }
        }
      });
    });

    res.json({ message: "Daily bonus claimed ✅" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/bonus/rakeback
export const claimRakeback = async (req, res) => {
  try {
    const userId = req.user.id;

    // example logic
    const rakebackAmount = 20;

    await prisma.$transaction(async (tx) => {
      await tx.walletTransaction.create({
        data: {
          userId,
          currency: "INR",
          amount: rakebackAmount,
          type: "DEPOSIT",
          status: "COMPLETED",
          referenceType: "RAKEBACK"
        }
      });

      await tx.wallet.update({
        where: {
          userId_currency: {
            userId,
            currency: "INR"
          }
        },
        data: {
          bonus: {
            increment: rakebackAmount
          }
        }
      });
    });

    res.json({ message: "Rakeback claimed 💰" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const getBonusSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    /* ===== WALLET BONUS ===== */
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      select: { bonus: true }
    });

    const totalBonus = wallets.reduce(
      (sum, w) => sum + Number(w.bonus || 0),
      0
    );

    /* ===== REFERRAL BONUS ===== */
    const referral = await prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        referenceType: "REFERRAL"
      }
    });

    /* ===== TOTAL CLAIMED BONUS ===== */
    const claimed = await prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: {
          in: ["REFERRAL_REWARD", "BET_WIN"]
        }
      }
    });

    res.json({
      totalBonus,
      totalClaimed: Number(claimed._sum.amount || 0),

      breakdown: {
        referral: Number(referral._sum.amount || 0),
        vip: 0,
        general: 0,
        locked: totalBonus // simple for now
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getMonthlyDepositBonus = async (req, res) => {
  try {
    const userId = req.user.id;

    const deposits = await prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: "DEPOSIT"
      }
    });

    const totalDeposit = Number(deposits._sum.amount || 0);

    let bonusPct = 0;

    if (totalDeposit > 100000) bonusPct = 360;
    else if (totalDeposit > 50000) bonusPct = 300;
    else if (totalDeposit > 10000) bonusPct = 240;
    else bonusPct = 180;

    res.json({
      totalDeposit,
      bonusPct,
      estimatedBonus: (totalDeposit * bonusPct) / 100
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const redeemCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Code required" });
    }

    // demo logic
    if (code !== "FREE100") {
      return res.status(400).json({ message: "Invalid code" });
    }

    await prisma.wallet.update({
      where: {
        userId_currency: { userId, currency: "INR" }
      },
      data: {
        bonus: { increment: 100 }
      }
    });

    res.json({ message: "Bonus redeemed ✅", amount: 100 });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getBonusFull = async (req, res) => {
  try {
    const userId = req.user.id;

    /* ================= SUMMARY ================= */

    const wallets = await prisma.wallet.findMany({
      where: { userId },
      select: { bonus: true }
    });

    const totalBonus = wallets.reduce(
      (sum, w) => sum + Number(w.bonus || 0),
      0
    );

    const referral = await prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        referenceType: "REFERRAL"
      }
    });

    /* ================= VIP (STATIC LOGIC FOR NOW) ================= */

    const xp = 0; // 🔥 later calculate from bets
    const level = 0;
    const nextXp = 100;

    /* ================= MONTHLY BONUS ================= */

    const monthlyTiers = [
      { pct: 180, min: 0 },
      { pct: 240, min: 10000 },
      { pct: 300, min: 50000 },
      { pct: 360, min: 100000 },
    ];

    const userDeposit = await prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: "DEPOSIT"
      }
    });

    const totalDeposit = Number(userDeposit._sum.amount || 0);

    const tiers = monthlyTiers.map((t, i) => ({
      pct: t.pct,
      active:
        totalDeposit >= t.min &&
        (i === monthlyTiers.length - 1 ||
          totalDeposit < monthlyTiers[i + 1].min),
    }));

    /* ================= BONUS LIST ================= */

    const bonuses = [
      {
        type: "DAILY",
        title: "Daily Bonus",
        locked: level < 2,
        unlockLevel: 2
      },
      {
        type: "RAKEBACK",
        title: "USD Rakeback",
        lockedAmount: 1,
        unlockRate: 20,
        ready: 0,
        canClaim: true,
        nextClaimIn: 3600 * 1000
      },
      {
        type: "SPIN",
        title: "Lucky Spin",
        dailyProgress: "0/18134"
      },
      {
        type: "VAULT",
        title: "Vault Pro",
        holdings: 0,
        returns: 0
      }
    ];

    /* ================= RESPONSE ================= */

    res.json({
      summary: {
        totalBonus,
        referral: Number(referral._sum.amount || 0),
        vip: 0,
        general: 0,
        locked: totalBonus
      },

      vip: {
        level,
        xp,
        nextXp,
        progress: Math.min((xp / nextXp) * 100, 100)
      },

      monthlyBonus: {
        tiers,
        totalDeposit,
        resetInDays: 22
      },

      bonuses
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const seedBonusTestData = async (req, res) => {
  try {
    const userId = req.user.id;

    /* ===== Add deposit ===== */
    await prisma.walletTransaction.create({
      data: {
        userId,
        currency: "INR",
        amount: 20000,
        type: "DEPOSIT",
        status: "COMPLETED"
      }
    });

    /* ===== Add referral reward ===== */
    await prisma.walletTransaction.create({
      data: {
        userId,
        currency: "INR",
        amount: 100,
        type: "REFERRAL_REWARD",
        status: "COMPLETED",
        referenceType: "REFERRAL",
        referenceId: "999"
      }
    });

    /* ===== Update wallet bonus ===== */
    await prisma.wallet.updateMany({
      where: { userId },
      data: {
        bonus: {
          increment: 100
        }
      }
    });

    res.json({
      message: "✅ Test bonus data added"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};