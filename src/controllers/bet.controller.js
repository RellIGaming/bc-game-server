import prisma from "../prisma.js";

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

export const placeBet = async (req, res) => {
  try {
    const { userId, optionId, amount } = req.body

    const option = await prisma.marketOption.findUnique({
      where: { id: BigInt(optionId) },
      include: { market: true }
    })

    if (!option || !option.isActive) {
      return res.status(400).json({ error: "Invalid option" })
    }

    const potentialWin = Number(amount) * Number(option.odds)

    const bet = await prisma.bet.create({
      data: {
        userId: BigInt(userId),
        matchId: option.market.matchId,
        marketId: option.marketId,
        optionId: BigInt(optionId),
        oddsLocked: option.odds,
        amount: Number(amount),
        potentialWin
      }
    })

    res.json(bet)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Internal server error" })
  }
}