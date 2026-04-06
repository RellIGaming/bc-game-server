import prisma from '../prisma.js';

export const getMatches = async (req, res) => {
  try {
    const { sport } = req.params;
    const { type } = req.query; // live or upcoming

    const isLive = type === "live";

    const matches = await prisma.match.findMany({
      where: {
        sport,
        isLive
      },
      orderBy: { startTime: "asc" }
    });

    const formatted = matches.map(m => ({
      id: m.id,
      league: m.league,
      country: m.country,
      startTime: m.startTime,
      isLive: m.isLive,
      liveTime: m.liveTime,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      odds: {
        home: Number(m.homeOdds),
        draw: m.drawOdds ? Number(m.drawOdds) : null,
        away: Number(m.awayOdds)
      }
    }));

    res.json(formatted);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id: Number(id) }
    });

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    res.json(match);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const placeSportsBet = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { matchId, amount, selection } = req.body;
    // selection = "home" | "draw" | "away"

    const match = await prisma.match.findUnique({
      where: { id: Number(matchId) }
    });

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    let odds;

    if (selection === "home") odds = match.homeOdds;
    else if (selection === "draw") odds = match.drawOdds;
    else if (selection === "away") odds = match.awayOdds;
    else return res.status(400).json({ message: "Invalid selection" });

    if (!odds) {
      return res.status(400).json({ message: "Invalid betting option" });
    }

    await prisma.$transaction(async (tx) => {

      const user = await tx.user.findUnique({
        where: { id: userId }
      });

      if (!user || Number(user.balance) < Number(amount)) {
        throw new Error("Insufficient balance");
      }

      // Deduct balance
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { decrement: amount }
        }
      });

      // Create bet
      await tx.bet.create({
        data: {
          userId,
          matchId: Number(matchId),
          amount,
          multiplier: odds,
          status: "PENDING"
        }
      });

      // Wallet transaction record
      await tx.walletTransaction.create({
        data: {
          userId,
          type: "BET",
          status: "COMPLETED",
          amount
        }
      });

    });

    res.json({ message: "Bet placed successfully" });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
export const settleMatch = async (req, res) => {
  try {
    const { matchId, result } = req.body;
    // result = "home" | "draw" | "away"

    const bets = await prisma.bet.findMany({
      where: {
        matchId: Number(matchId),
        status: "PENDING"
      }
    });

    for (const bet of bets) {

      let isWinner = false;

      if (
        (result === "home" && bet.multiplier == bet.multiplier) // multiplier already stored
      ) {
        isWinner = true;
      }

      if (isWinner) {
        const winAmount = Number(bet.amount) * Number(bet.multiplier);

        await prisma.$transaction(async (tx) => {

          await tx.bet.update({
            where: { id: bet.id },
            data: {
              profit: winAmount,
              status: "WON"
            }
          });

          await tx.user.update({
            where: { id: bet.userId },
            data: {
              balance: { increment: winAmount }
            }
          });

          await tx.walletTransaction.create({
            data: {
              userId: bet.userId,
              type: "WIN",
              status: "COMPLETED",
              amount: winAmount
            }
          });

        });

      } else {

        await prisma.bet.update({
          where: { id: bet.id },
          data: {
            profit: 0,
            status: "LOST"
          }
        });

      }
    }

    res.json({ message: "Match settled successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};