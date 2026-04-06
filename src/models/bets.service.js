import prisma from '../prisma.js';
import redis from '../../config/redis.js';
import { getIO } from '../utils/socket.js';

export async function getBets(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [bets, total] = await Promise.all([
    prisma.crashBet.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: true, game: true }
    }),
    prisma.crashBet.count()
  ]);

  return {
    data: bets,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function placeBet(userId, gameId, amount) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.balance < amount) {
    throw new Error('Insufficient balance');
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } }
    });

    return tx.bet.create({
      data: {
        userId,
        gameId,
        amount
      }
    });
  });

  await redis.del('live_bets');

  const io = getIO();
  io.emit('new_bet', result);

  return result;
}