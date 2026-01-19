import User from "../models/User.model.js";
import WalletTransaction from "../models/WalletTransaction.js";

/* ================= OVERVIEW STATS ================= */
export const getDashboardStats = async (req, res) => {
  const [
    totalUsers,
    usersByRole,
    totalBalance,
    totalCredits,
    totalDebits,
  ] = await Promise.all([
    User.countDocuments(),
    User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $group: { _id: null, sum: { $sum: "$balance" } } },
    ]),
    WalletTransaction.aggregate([
      { $match: { type: "credit" } },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]),
    WalletTransaction.aggregate([
      { $match: { type: "debit" } },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]),
  ]);

  res.json({
    totalUsers,
    usersByRole,
    totalBalance: totalBalance[0]?.sum || 0,
    totalCredits: totalCredits[0]?.sum || 0,
    totalDebits: totalDebits[0]?.sum || 0,
  });
};

/* ================= RECENT USERS ================= */
export const getRecentUsers = async (req, res) => {
  const users = await User.find()
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(10);

  res.json(users);
};

/* ================= RECENT TRANSACTIONS ================= */
export const getRecentTransactions = async (req, res) => {
  const txns = await WalletTransaction.find()
    .populate("user", "username email")
    .sort({ createdAt: -1 })
    .limit(10);

  res.json(txns);
};

/* ================= DAILY REGISTRATION CHART ================= */
export const getDailyRegistrations = async (req, res) => {
  const data = await User.aggregate([
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json(data);
};

/* ================= DAILY WALLET FLOW ================= */
export const getDailyWalletFlow = async (req, res) => {
  const data = await WalletTransaction.aggregate([
    {
      $group: {
        _id: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.date": 1 } },
  ]);

  res.json(data);
};
