import pool from "../../config/db.js";

/* ================= OVERVIEW STATS ================= */
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      usersByRole,
      totalBalance,
      totalCredits,
      totalDebits,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users`),

      pool.query(`
        SELECT role, COUNT(*) 
        FROM users 
        GROUP BY role
      `),

      pool.query(`
        SELECT COALESCE(SUM(balance),0) AS sum 
        FROM users
      `),

      pool.query(`
        SELECT COALESCE(SUM(amount),0) AS sum 
        FROM wallet_transactions 
        WHERE type = 'credit'
      `),

      pool.query(`
        SELECT COALESCE(SUM(amount),0) AS sum 
        FROM wallet_transactions 
        WHERE type = 'debit'
      `),
    ]);

    res.json({
      totalUsers: Number(totalUsers.rows[0].count),
      usersByRole: usersByRole.rows,
      totalBalance: totalBalance.rows[0].sum,
      totalCredits: totalCredits.rows[0].sum,
      totalDebits: totalDebits.rows[0].sum,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= RECENT USERS ================= */
export const getRecentUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, email, role, balance, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= RECENT TRANSACTIONS ================= */
export const getRecentTransactions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT wt.*, u.username, u.email
      FROM wallet_transactions wt
      JOIN users u ON wt.user_id = u.id
      ORDER BY wt.created_at DESC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DAILY REGISTRATION CHART ================= */
export const getDailyRegistrations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DATE(created_at) AS date, COUNT(*) 
      FROM users
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DAILY WALLET FLOW ================= */
export const getDailyWalletFlow = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DATE(created_at) AS date, type, SUM(amount) AS total
      FROM wallet_transactions
      GROUP BY DATE(created_at), type
      ORDER BY date ASC
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};