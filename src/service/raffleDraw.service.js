import prisma from "../prisma.js";


export const drawWinners = async () => {
  const round = await prisma.raffleRound.findFirst({
    where: { status: "ACTIVE", drawAt: { lte: new Date() } },
    include: { tickets: true },
  });

  if (!round) return;

  const tickets = round.tickets;

  if (tickets.length === 0) return;

  // Shuffle tickets
  const shuffled = tickets.sort(() => 0.5 - Math.random());

  const winners = shuffled.slice(0, 10);

  const prizeDistribution = [50, 25, 12, 6, 3, 1.5, 0.9, 0.7, 0.5, 0.4];

  for (let i = 0; i < winners.length; i++) {
    const prize = (Number(round.prizePool) * prizeDistribution[i]) / 100;

    await prisma.raffleTicket.update({
      where: { id: winners[i].id },
      data: {
        isWinner: true,
        prize,
      },
    });
  }

  await prisma.raffleRound.update({
    where: { roundId: round.roundId },
    data: { status: "DRAWN" },
  });
};