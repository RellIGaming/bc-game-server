import prisma from "../prisma.js";


// controllers/raffle.controller.js

// 🔹 Get Weekly Raffle Main Data
export const getRaffleData = async (req, res) => {
  try {
    const userId = req.user?.id;

    const round = await prisma.raffleRound.findFirst({
      where: { isActive: true }
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

    res.json(tickets);

  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};

export const getWinners = async (req, res) => {
  const { roundId, page = 1 } = req.query;

  const limit = 10;
  const skip = (page - 1) * limit;

  const tickets = await prisma.raffleTicket.findMany({
    where: { roundId, isWinner: true },
    include: { user: true },
    orderBy: { prize: "desc" },
    skip,
    take: limit,
  });

  const total = await prisma.raffleTicket.count({
    where: { roundId, isWinner: true },
  });

  res.json({
    data: tickets.map((t, i) => ({
      rank: i + 1,
      username: t.user.username,
      ticketNumber: t.ticketNumber,
      prize: t.prize,
    })),
    totalPages: Math.ceil(total / limit),
  });
};

