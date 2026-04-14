
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

    // 🔹 Example logic (replace with real queries)
    const prizePool = 4938.73;

    const startDate = new Date("2026-02-07");
    const endDate = new Date("2026-02-08");

    const leaderboard = await prisma.user.findMany({
      take: 10,
      orderBy: { balance: "desc" },
      select: {
        username: true,
        balance: true
      }
    });

    // 🔥 USER DATA
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true }
    });

    const userWager = Number(user?.balance || 0);

    const minTopWager = leaderboard[leaderboard.length - 1]?.balance || 0;

    const wagerToTop10 = Math.max(minTopWager - userWager, 0);

    const userRank =
      leaderboard.findIndex(u => u.username === user?.username) + 1 || null;

    res.json({
      prizePool,
      startDate,
      endDate,
      leaderboard,

      // ✅ IMPORTANT
      userStats: {
        rank: userRank || "50+",
        wager: userWager,
        wagerToTop10
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed" });
  }
};