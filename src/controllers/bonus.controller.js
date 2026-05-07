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
          currency: "BDT",
          amount,
          type: "DEPOSIT",
          status: "COMPLETED",
          referenceType: "DAILY_BONUS"
        }
      });

      await tx.wallet.update({
        where: {
          userId_currency: { userId, currency: "BDT" }
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
          currency: "BDT",
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
            currency: "BDT"
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
      totalClaimed: Number(claimed._sum.amount || 0),
      vipBonus: 0,
      specialBonus: 0,
      generalBonus: Number(referral._sum.amount || 0),
      lockedBonus: totalBonus
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
      tiers: [
        { percentage: 180, active: totalDeposit < 10000 },
        { percentage: 240, active: totalDeposit >= 10000 && totalDeposit < 50000 },
        { percentage: 300, active: totalDeposit >= 50000 && totalDeposit < 100000 },
        { percentage: 360, active: totalDeposit >= 100000 }
      ],
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

    /* ================= VALIDATION ================= */

    if (!code) {
      return res.status(400).json({
        message: "Code required"
      });
    }

    /* ================= FIND BONUS ================= */

    const bonus = await prisma.bonusCode.findUnique({
      where: { code }
    });

    if (!bonus || !bonus.isActive) {
      return res.status(400).json({
        message: "Invalid code"
      });
    }

    /* ================= ALREADY USED ================= */

    const alreadyUsed = await prisma.bonusRedemption.findUnique({
      where: {
        userId_bonusId: {
          userId,
          bonusId: bonus.id
        }
      }
    });

    if (alreadyUsed) {
      return res.status(400).json({
        message: "Already redeemed"
      });
    }

    /* ================= CALCULATE BONUS ================= */

    let finalAmount = 0;

    // FIXED BONUS
    if (bonus.type === "FIXED") {
      finalAmount = Number(bonus.amount);
    }

    // PERCENT BONUS
    if (bonus.type === "PERCENT") {

      const lastDeposit = await prisma.walletTransaction.findFirst({
        where: {
          userId,
          type: "DEPOSIT"
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      const depositAmount = Number(lastDeposit?.amount || 0);

      console.log("Deposit Amount:", depositAmount);

      finalAmount =
        (depositAmount * Number(bonus.amount)) / 100;
    }

    console.log("Final Bonus Amount:", finalAmount);

    if (finalAmount <= 0) {
      return res.status(400).json({
        message: "Invalid bonus amount"
      });
    }

    /* ================= APPLY BONUS ================= */

    await prisma.$transaction(async (tx) => {

      /* ===== WALLET ===== */

      await tx.wallet.upsert({
        where: {
          userId_currency: {
            userId,
            currency: "BDT"
          }
        },

        update: {
          bonus: {
            increment: finalAmount
          },

          lockedAmount: {
            increment: finalAmount * 10
          }
        },

        create: {
          userId,
          currency: "BDT",
          balance: 0,
          bonus: finalAmount,
          lockedAmount: finalAmount * 10
        }
      });

      /* ===== TRANSACTION ===== */

      await tx.walletTransaction.create({
        data: {
          userId,
          currency: "BDT",
          amount: finalAmount,
          type: "DEPOSIT",
          status: "COMPLETED",

          referenceType: "BONUS_CODE",

          // IMPORTANT FIX
          referenceId: bonus.id.toString()
        }
      });

      /* ===== SAVE REDEMPTION ===== */

      await tx.bonusRedemption.create({
        data: {
          userId,
          bonusId: bonus.id,
          amount: finalAmount
        }
      });

      /* ===== UPDATE BONUS USAGE ===== */

      await tx.bonusCode.update({
        where: {
          id: bonus.id
        },

        data: {
          usedCount: {
            increment: 1
          }
        }
      });

      /* ===== CREATE ROLLOVER ===== */

      await tx.rollover.create({
        data: {
          userId,
          bonusId: bonus.id,

          source: "BONUS_CODE",

          required: finalAmount * 10,

          wagered: 0,

          isCompleted: false
        }
      });

    });

    /* ================= RESPONSE ================= */

    return res.json({
      success: true,
      message: "Bonus redeemed successfully ✅",
      amount: finalAmount
    });

  } catch (err) {

    console.error("REDEEM BONUS ERROR:", err);

    return res.status(500).json({
      message: err.message
    });
  }
};

export const getBonusFull = async (req, res) => {
  try {
    const userId = req.user.id;

    /* ================= USER ================= */

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        xp: true
      }
    });
 console.log(user);
    const xp = Number(user?.xp || 0);

    const level = Math.floor(xp / 100);

    const nextXp = (level + 1) * 100;

    /* ================= SUMMARY ================= */

    const wallets = await prisma.wallet.findMany({
      where: { userId },
      select: {
        bonus: true
      }
    });

    const totalBonus = wallets.reduce(
      (sum, w) => sum + Number(w.bonus || 0),
      0
    );

    const referral = await prisma.walletTransaction.aggregate({
      _sum: {
        amount: true
      },
      where: {
        userId,
        referenceType: "REFERRAL"
      }
    });

    /* ================= MONTHLY BONUS ================= */

    const monthlyTiers = [
      { percentage: 180, min: 0 },
      { percentage: 240, min: 10000 },
      { percentage: 300, min: 50000 },
      { percentage: 360, min: 100000 }
    ];

    const userDeposit = await prisma.walletTransaction.aggregate({
      _sum: {
        amount: true
      },
      where: {
        userId,
        type: "DEPOSIT"
      }
    });

    const totalDeposit = Number(userDeposit._sum.amount || 0);

    const tiers = monthlyTiers.map((t, i) => ({
      percentage: t.percentage,
      active:
        totalDeposit >= t.min &&
        (i === monthlyTiers.length - 1 ||
          totalDeposit < monthlyTiers[i + 1].min)
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
        totalClaimed: totalBonus,
        vipBonus: 0,
        specialBonus: 0,
        generalBonus: Number(referral._sum.amount || 0),
        lockedBonus: totalBonus
      },

      vip: {
        level,
        xp,
        nextXp,
        progress:
          nextXp > 0
            ? Math.min((xp / nextXp) * 100, 100)
            : 0
      },

      monthlyBonus: {
        tiers,
        totalDeposit,
        resetInDays: 22
      },

      bonuses
    });

  } catch (err) {
  console.error("BONUS FULL ERROR FULL:");
  console.error(err);

  return res.status(500).json({
    message: err.message,
    stack: err.stack
  });
}
};

export const seedBonusTestData = async (req, res) => {
  try {
    const userId = req.user.id;

    /* ===== Add deposit ===== */
    await prisma.walletTransaction.create({
      data: {
        userId,
        currency: "BDT",
        amount: 20000,
        type: "DEPOSIT",
        status: "COMPLETED"
      }
    });

    /* ===== Add referral reward ===== */
    await prisma.walletTransaction.create({
      data: {
        userId,
        currency: "BDT",
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

// GET /api/bonus/vip-levels
export const getVipLevels = async (req, res) => {
  try {
    // 👉 static for now (later DB से load कर सकते हो)
    const vipLevels = [
      {
        name: "Bronze VIP 2–7",
        key: "Bronze",
        levels: [
          { level: "VIP 02", xp: 100 },
          { level: "VIP 03", xp: 200 },
          { level: "VIP 04", xp: 1000 },
          { level: "VIP 05", xp: 2000 },
          { level: "VIP 06", xp: 3000 },
          { level: "VIP 07", xp: 4000 },
        ],
      },
      {
        name: "Silver VIP 8–21",
        key: "Silver",
        levels: [
          { level: "VIP 08", xp: 5000 },
          { level: "VIP 09", xp: 7000 },
        ],
      },
      {
        name: "Gold VIP 22–37",
        key: "Gold",
        levels: [],
      },
      {
        name: "Platinum I VIP 38–55",
        key: "Platinum1",
        levels: [],
      },
    ];

    res.json({
      success: true,
      vipLevels,
    });
  } catch (err) {
    console.error("VIP Levels Error:", err);
    res.status(500).json({ message: "Failed to fetch VIP levels" });
  }
};

// GET /api/bonus/vip-club
export const getVipClub = async (req, res) => {
  try {
    const data = {
      perks: [
        {
          icon: "lossback",
          title: "Instant Lossback",
          desc: "Earn rewards back instantly as you play",
        },
        {
          icon: "bonus",
          title: "Reload Bonuses",
          desc: "Receive rewards every day — the more you play, the higher you get.",
        },
        {
          icon: "box",
          title: "Gameplay Bonuses",
          desc: "Play across different game types to unlock richer rewards.",
        },
        {
          icon: "lossback",
          title: "Top Player Bonuses",
          desc: "Play at the top to unlock exclusive rewards.",
        },
        {
          icon: "bonus",
          title: "Fee-Free D & W",
          desc: "All deposits and withdrawals are fee-free.",
        },
        {
          icon: "box",
          title: "IRL VIP Events & Rewards",
          desc: "Exclusive real-world VIP experiences.",
        },
        {
          icon: "bonus",
          title: "Dedicated VIP Host",
          desc: "Personalized support whenever you need it",
        },
      ],

      access: [
        {
          icon: "bonus",
          title: "Activity",
          desc: "Consistent gameplay helps you stand out.",
        },
        {
          icon: "lossback",
          title: "Loyalty",
          desc: "Stable loyalty increases VIP chances.",
        },
        {
          icon: "box",
          title: "No Barriers",
          desc: "No level requirement — everyone can qualify.",
        },
      ],

      faqCategories: ["General", "Benefits"],

      faqs: [
        {
          category: "General",
          q: "How do I become a VIP?",
          a: "VIP status is based on activity and loyalty.",
        },
        {
          category: "General",
          q: "What is VIP Transfer?",
          a: "Transfer VIP benefits under conditions.",
        },
      ],
    };

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "VIP Club fetch failed" });
  }
};

export const getVipBonusTable = async (req, res) => {
  try {
    const userId = req.user?.id;

    // 🔥 Example: fetch from DB
    const userXp = 3200;

    const tiers = [
      { name: "Bronze", color: "#CD7F32", minXp: 0 },
      { name: "Silver", color: "#C0C0C0", minXp: 1000 },
      { name: "Gold", color: "#FFD700", minXp: 5000 },
      { name: "Platinum I", color: "#E5E4E2", minXp: 10000 },
      { name: "Diamond II", color: "#7FDBFF", minXp: 20000 }
    ];

    // 🔥 Calculate user tier
    let currentTier = tiers[0];
    let nextTier = tiers[1];

    for (let i = 0; i < tiers.length; i++) {
      if (userXp >= tiers[i].minXp) {
        currentTier = tiers[i];
        nextTier = tiers[i + 1] || null;
      }
    }

    const progressPercent = nextTier
      ? Math.min(
        ((userXp - currentTier.minXp) /
          (nextTier.minXp - currentTier.minXp)) *
        100,
        100
      )
      : 100;

    res.json({
      tiers,
      rows: [
        {
          label: "Daily Bonus",
          icon: "gift",
          enabled: ["Bronze", "Silver", "Gold"]
        },
        {
          label: "VIP Spin",
          icon: "trophy",
          enabled: ["Gold", "Platinum I", "Diamond II"]
        },
        {
          label: "Weekly Cashback",
          icon: "coins",
          enabled: ["Silver", "Gold", "Platinum I", "Diamond II"]
        }
      ],
      userProgress: {
        currentXp: userXp,
        currentTier: currentTier.name,
        nextTier: nextTier?.name || null,
        progressPercent
      }
    });
  } catch (err) {
    res.status(500).json({ message: "VIP table error" });
  }
};