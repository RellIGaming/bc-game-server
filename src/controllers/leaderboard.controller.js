import { getDailyTopWinners, getWeeklyTopWinners, getBiggestWin } from '../models/leaderboard.service.js';

export async function daily(req, res) {
  const data = await getDailyTopWinners();
  res.json(data);
}

export async function weekly(req, res) {
  const data = await getWeeklyTopWinners();
  res.json(data);
}

export async function biggest(req, res) {
  const data = await getBiggestWin();
  res.json(data);
}