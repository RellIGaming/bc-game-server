import prisma from "../prisma.js";



const TICKET_WAGER_AMOUNT = 8000;

export const generateTickets = async (userId, wagerAmount) => {
  const round = await prisma.raffleRound.findFirst({
    where: { status: "ACTIVE" },
  });

  if (!round) return;

  const ticketsToGenerate = Math.floor(wagerAmount / TICKET_WAGER_AMOUNT);

  if (ticketsToGenerate <= 0) return;

  const tickets = [];

  for (let i = 0; i < ticketsToGenerate; i++) {
    tickets.push({
      userId,
      roundId: round.roundId,
      ticketNumber: Math.floor(Math.random() * 90000000 + 10000000).toString(),
      wagerAmount,
    });
  }

  await prisma.raffleTicket.createMany({
    data: tickets,
  });

  await prisma.raffleRound.update({
    where: { roundId: round.roundId },
    data: {
      totalTickets: { increment: ticketsToGenerate },
      prizePool: { increment: wagerAmount * 0.02 }, // 2% to pool
    },
  });
};