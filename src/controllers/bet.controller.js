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

/* ================= PLACE BET ================= */

export const placeBet = async (req, res) => {
  try {
    const { userId, optionId, amount } = req.body;

    /* ===== 1. GET OPTION ===== */

    const option = await prisma.marketOption.findUnique({
      where: { id: BigInt(optionId) },
      include: { market: true }
    });

    if (!option || !option.isActive) {
      return res.status(400).json({ error: "Invalid option" });
    }

    const betAmount = Number(amount);
    const potentialWin = betAmount * Number(option.odds);

    /* ===== 2. CREATE BET ===== */

    const bet = await prisma.bet.create({
      data: {
        userId: BigInt(userId),
        matchId: option.market.matchId,
        marketId: option.marketId,
        optionId: BigInt(optionId),
        oddsLocked: option.odds,
        amount: betAmount,
        potentialWin
      }
    });

    /* ===== 3. MULTI-LEVEL COMMISSION ===== */

    const uplines = await getUpline(userId);

    for (const upline of uplines) {
      const commission = betAmount * LEVEL_COMMISSION[upline.level];

      await prisma.$transaction(async (tx) => {

        // 👉 Add bonus
        await tx.wallet.update({
          where: {
            userId_currency: {
              userId: upline.userId,
              currency: "INR"
            }
          },
          data: {
            bonus: { increment: commission }
          }
        });

        // 👉 Save transaction
        await tx.walletTransaction.create({
          data: {
            userId: upline.userId,
            currency: "INR",
            amount: commission,
            type: "COMMISSION",
            status: "COMPLETED",
            referenceType: "REFERRAL",
            referenceId: String(userId)
          }
        });

      });

      /* ===== 🔥 REAL-TIME SOCKET ===== */

      sendUserNotification(upline.userId, {
        type: "COMMISSION",
        amount: commission,
        fromUser: userId
      });
    }

    /* ===== 4. UPDATE WAGER ===== */

    await prisma.referralProgress.updateMany({
      where: {
        friendId: BigInt(userId)
      },
      data: {
        totalWager: {
          increment: betAmount
        }
      }
    });

    /* ===== 5. AUTO UNLOCK REWARD ===== */

    const progressList = await prisma.referralProgress.findMany({
      where: { friendId: BigInt(userId) }
    });

    for (const p of progressList) {
      if (p.totalWager >= 1000 && !p.level1Unlocked) {

        // 👉 give reward
        await prisma.wallet.update({
          where: {
            userId_currency: {
              userId: p.userId,
              currency: "INR"
            }
          },
          data: {
            bonus: { increment: 100 }
          }
        });

        // 👉 mark unlocked
        await prisma.referralProgress.update({
          where: { id: p.id },
          data: { level1Unlocked: true }
        });

        // 👉 socket notify
        sendUserNotification(p.userId, {
          type: "REFERRAL_REWARD",
          amount: 100,
          friend: userId
        });
      }
    }

    /* ===== FINAL RESPONSE ===== */

    res.json(bet);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};