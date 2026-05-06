import prisma from "../prisma.js";


// controllers/raffle.controller.js
export const getTimeLeft = (targetDate) => {
  const diff = new Date(targetDate).getTime() - Date.now();

  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};
// 🔹 Get Weekly Raffle Main Data
export const getRaffleData = async (req, res) => {
  try {
    const userId = req.user?.id;
    const now = new Date();
    const timeLeft = round.drawAt - now;

    const round = await prisma.raffleRound.findFirst({
      where: { status: "ACTIVE" }
    });

    if (!round) {
      return res.json({ message: "No active round" });
    }

    // 🔹 User tickets
    const tickets = await prisma.raffleTicket.findMany({
      where: { userId, roundId: round.roundId }
    });

    // 🔹 Winning tickets
    const winningTickets = await prisma.raffleTicket.count({
      where: { userId, roundId: round.roundId, isWinner: true }
    });

    // 🔹 Total prize won
    const winnings = await prisma.raffleWinner.aggregate({
      where: { userId, roundId: round.roundId },
      _sum: { prize: true }
    });

    res.json({
      roundId: round.roundId,
      prizePool: round.prizePool,
      totalTickets: round.totalTickets,
      drawTime: round.drawTime,
      timeLeft,
      userStats: {
        totalTickets: tickets.length,
        winningTickets,
        totalPrize: winnings._sum.prize || 0
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed" });
  }
};

// Get Winners (with pagination)

export const getRaffleWinners = async (req, res) => {
  try {
    const { page = 1, limit = 10, roundId } = req.query;

    const skip = (page - 1) * limit;

    const winners = await prisma.raffleWinner.findMany({
      where: { roundId },
      include: { user: true },
      skip: Number(skip),
      take: Number(limit),
      orderBy: { prize: "desc" }
    });

    const total = await prisma.raffleWinner.count({
      where: { roundId }
    });

    res.json({
      winners: winners.map((w, i) => ({
        no: skip + i + 1,
        name: w.user.username,
        ticketNumber: w.ticketNo,
        prize: w.prize
      })),
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed" });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = "active" } = req.query;

    let where = { userId };
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (type === "past") {
      where.isWinner = false;
    }

    if (type === "winnings") {
      where.isWinner = true;
    }

    const tickets = await prisma.raffleTicket.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    res.json({
      tickets,
      stats: {
        total: tickets.length,
        winnings: tickets.filter(t => t.isWinner).length,
        prize: 0 // or calculate if needed
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};



