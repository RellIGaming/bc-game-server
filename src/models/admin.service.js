import prisma from '../prisma.js';
import redis from '../../config/redis.js';
import { getIO } from '../utils/socket.js';

export async function getDashboardOverview() {
  const cacheKey = 'admin:dashboard';

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const totalBets = await prisma.bet.aggregate({
    _sum: { amount: true }
  });

  const totalPayout = await prisma.bet.aggregate({
    where: { status: 'WON' },
    _sum: { profit: true }
  });

  const totalUsers = await prisma.user.count();

  const totalProfit =
    (totalBets._sum.amount || 0) -
    (totalPayout._sum.profit || 0);

  const data = {
    totalWagered: totalBets._sum.amount || 0,
    totalPaidOut: totalPayout._sum.profit || 0,
    platformProfit: totalProfit,
    totalUsers
  };

  await redis.set(cacheKey, JSON.stringify(data), 'EX', 60);

  return data;
}

export async function getDailyRevenue() {
  const result = await prisma.$queryRaw`
    SELECT 
      DATE(created_at) as date,
      SUM(amount) as total_bets,
      SUM(CASE WHEN status = 'WON' THEN profit ELSE 0 END) as total_payout
    FROM bets
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `;

  return result.map(r => ({
    date: r.date,
    revenue: r.total_bets - r.total_payout
  }));
}
export async function getProfitByGame() {
  const result = await prisma.$queryRaw`
    SELECT 
      g.name,
      SUM(b.amount) as total_bets,
      SUM(CASE WHEN b.status = 'WON' THEN b.profit ELSE 0 END) as total_payout
    FROM bets b
    JOIN games g ON b.game_id = g.id
    GROUP BY g.name
    ORDER BY total_bets DESC
  `;

  return result.map(r => ({
    game: r.name,
    profit: r.total_bets - r.total_payout
  }));
}