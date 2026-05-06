import prisma from "../prisma.js";


// bet.controller.js
/* ================= LEVEL COMMISSION ================= */

const LEVEL_COMMISSION = {
  1: 0.01,   // 1%
  2: 0.005,  // 0.5%
  3: 0.002   // 0.2%
};

/* ================= GET UPLINE (FIXED) ================= */

const getUpline = async (userId) => {
  const result = [];

  let current = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: { referredBy: true }
  });

  let level = 1;

  while (current?.referredBy && level <= 3) {
    result.push({
      userId: current.referredBy,
      level
    });

    current = await prisma.user.findUnique({
      where: { id: current.referredBy },
      select: { referredBy: true }
    });

    level++;
  }

  return result;
};
export const getLiveBets = async (req, res) => {
  try {
    const bets = await prisma.bet.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },   // ✅ FIXED
      include: { user: true, game: true }
    });

    const formatted = bets.map(b => ({
      game: b.game.name,
      player: b.user.username,
      betAmount: b.amount,
      multiplier: b.multiplier + "x",
      profit: b.profit,
      status: b.status
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBetsFeed = async (req, res) => {
  try {
    const bets = await prisma.bet.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { user: true, game: true },
    });

    const formatted = bets.map((b) => ({
      id: String(b.id),
      sport: b.game?.slug || "all",
      event: `${b.game?.name}`,
      outcome:
        b.status === "WON"
          ? "Win"
          : b.status === "LOST"
            ? "Loss"
            : "Pending",
      odds: b.multiplier,
      stake: `${b.amount} $`,
      potentialWin: `${b.profit} $`,
      user: b.user?.username || "unknown",
      type: "single",
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= PLACE BET ================= //



export const placeBet = async (req, res) => {
  try {
    const { userId, optionId, amount } = req.body;

    const betAmount = Number(amount);

    /* ===== 1. GET USER WALLET ===== */
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId_currency: {
          userId: BigInt(userId),
          currency: "BDT"
        }
      }
    });

    if (!wallet) {
      return res.status(400).json({ error: "Wallet not found" });
    }

    let remainingAmount = betAmount;
    let useBonus = 0;
    let useBalance = 0;

    /* ===== 2. USE BONUS FIRST ===== */
    if (wallet.bonus > 0) {
      useBonus = Math.min(wallet.bonus, remainingAmount);
      remainingAmount -= useBonus;
    }

    /* ===== 3. USE REAL BALANCE ===== */
    if (remainingAmount > 0) {
      if (wallet.balance < remainingAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      useBalance = remainingAmount;
    }

    /* ===== 4. GET OPTION ===== */
    const option = await prisma.marketOption.findUnique({
      where: { id: BigInt(optionId) },
      include: { market: true }
    });

    if (!option || !option.isActive) {
      return res.status(400).json({ error: "Invalid option" });
    }

    const potentialWin = betAmount * Number(option.odds);

    /* ===== 5. TRANSACTION ===== */
    const bet = await prisma.$transaction(async (tx) => {

      /* 👉 Deduct wallet */
      await tx.wallet.update({
        where: {
          userId_currency: {
            userId: BigInt(userId),
            currency: "BDT"
          }
        },
        data: {
          bonus: { decrement: useBonus },
          balance: { decrement: useBalance }
        }
      });

      /* 👉 Create bet */
      const createdBet = await tx.bet.create({
        data: {
          userId: BigInt(userId),
          matchId: option.market.matchId,
          marketId: option.marketId,
          optionId: BigInt(optionId),
          oddsLocked: option.odds,
          amount: betAmount,
          potentialWin,
          usedBonus: useBonus,     // 🔥 important
          usedBalance: useBalance  // 🔥 important
        }
      });

      /* ===== 6. UPDATE ROLLOVER ===== */
      const rollovers = await tx.rollover.findMany({
        where: {
          userId: BigInt(userId),
          isCompleted: false
        }
      });

      for (const r of rollovers) {
        const newWagered = r.wagered + betAmount;

        await tx.rollover.update({
          where: { id: r.id },
          data: {
            wagered: newWagered,
            isCompleted: newWagered >= r.required
          }
        });

        /* 🔥 IF COMPLETED → UNLOCK BONUS */
        if (newWagered >= r.required && !r.isCompleted) {
          await tx.wallet.update({
            where: {
              userId_currency: {
                userId: BigInt(userId),
                currency: "BDT"
              }
            },
            data: {
              balance: { increment: r.required / 10 } // example unlock
            }
          });
        }
      }

      return createdBet;
    });

    /* ===== 7. COMMISSION ===== */
    const uplines = await getUpline(userId);

    for (const upline of uplines) {
      const commission = betAmount * LEVEL_COMMISSION[upline.level];

      await prisma.wallet.update({
        where: {
          userId_currency: {
            userId: upline.userId,
            currency: "BDT"
          }
        },
        data: {
          bonus: { increment: commission } // bonus only
        }
      });

      await prisma.walletTransaction.create({
        data: {
          userId: upline.userId,
          currency: "BDT",
          amount: commission,
          type: "COMMISSION",
          status: "COMPLETED",
          referenceType: "REFERRAL",
          referenceId: String(userId)
        }
      });

      sendUserNotification(upline.userId, {
        type: "COMMISSION",
        amount: commission
      });
    }

    /* ===== FINAL ===== */
    res.json(bet);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};