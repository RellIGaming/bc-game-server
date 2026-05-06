
import prisma from "../prisma.js";

// ================= ACTIVE CONTEST =================
export const getActiveContest = async (req, res) => {
  try {
    const contest = await prisma.dailyContest.findFirst({
      where: { isActive: true },
      include: {
        leaderboard: {
          orderBy: { rank: "asc" }
        }
      }
    });

    res.json(contest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= LEADERBOARD =================
export const getLeaderboard = async (req, res) => {
  try {
    const { contestId } = req.query;

    const data = await prisma.dailyContestLeaderboard.findMany({
      where: { contestId: Number(contestId) },
      orderBy: { rank: "asc" }
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= HISTORY =================
export const getContestHistory = async (req, res) => {
  try {
    const data = await prisma.dailyContestHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 10
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= RULES =================
export const getContestRules = async (req, res) => {
  try {
    const rules = await prisma.dailyContestRule.findMany({
      orderBy: { order: "asc" }
    });

    const currencies = await prisma.dailyContestCurrency.findMany({
      orderBy: { order: "asc" }
    });

    res.json({
      rules,
      currencies
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= MY POSITION =================
export const getMyContestPosition = async (req, res) => {
  try {
    const userId = req.user.id;

    const contest = await prisma.dailyContest.findFirst({
      where: { isActive: true }
    });

    if (!contest) {
      return res.json(null);
    }

    const entry = await prisma.dailyContestLeaderboard.findFirst({
      where: {
        contestId: contest.id,
        userId
      }
    });

    res.json({
      rank: entry ? entry.rank : null,
      wager: entry ? entry.wager : 0
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getDailyContest = async (req, res) => {
  try {
    const userId = req.user?.id;

    const contest = await prisma.dailyContest.findFirst({
      where: { isActive: true },
      include: {
        leaderboard: {
          orderBy: { rank: "asc" },
          take: 10
        }
      }
    });

    if (!contest) {
      return res.json({
        prizePool: 0,
        startDate: null,
        endDate: null,
        leaderboard: [],
        userStats: {
          rank: "50+",
          wager: 0,
          wagerToTop10: 0
        }
      });
    }

    const userEntry = await prisma.dailyContestLeaderboard.findFirst({
      where: {
        contestId: contest.id,
        userId
      }
    });

    const userWager = userEntry?.wager ?? 0;
    const userRank = userEntry?.rank ?? "50+";

    const lastTop = contest.leaderboard?.length
      ? contest.leaderboard[contest.leaderboard.length - 1]
      : null;

    const wagerToTop10 = lastTop
      ? Math.max(lastTop.wager - userWager, 0)
      : 0;

    res.json({
      prizePool: contest.prizePool,
      startDate: contest.startDate,
      endDate: contest.endDate,
      leaderboard: contest.leaderboard,

      userStats: {
        rank: userRank,
        wager: userWager,
        wagerToTop10
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed" });
  }
};