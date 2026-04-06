import prisma from '../prisma.js';
import redis from '../config/redis.js';
import { getIO } from '../utils/socket.js';

export async function getDailyTopWinners() {
  const cacheKey = 'leaderboard:daily';

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const result = await prisma.bet.groupBy({
    by: ['userId'],
    where: {
      status: 'WON',
      createdAt: {
        gte: new Date(new Date().setHours(0,0,0,0))
      }
    },
    _sum: {
      profit: true
    },
    orderBy: {
      _sum: { profit: 'desc' }
    },
    take: 10
  });

  await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
await redis.zincrby('leaderboard:daily', profit, userId);
await redis.zincrby('leaderboard:daily', profit, userId);

const io = getIO();
io.emit('leaderboard_update');
  return result;
}

export async function getWeeklyTopWinners() {
  const start = new Date();
  start.setDate(start.getDate() - 7);

  return prisma.bet.groupBy({
    by: ['userId'],
    where: {
      status: 'WON',
      createdAt: { gte: start }
    },
    _sum: { profit: true },
    orderBy: { _sum: { profit: 'desc' } },
    take: 10
  });
}

export async function getBiggestWin() {
  return prisma.bet.findFirst({
    where: { status: 'WON' },
    orderBy: { profit: 'desc' },
    include: { user: true }
  });
}

export async function getHighestMultiplier() {
  return prisma.bet.findFirst({
    where: {
      multiplier: { not: null }
    },
    orderBy: { multiplier: 'desc' }
  });
}
