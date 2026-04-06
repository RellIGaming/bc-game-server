import pool from "../../config/db.js";
import bcrypt from "bcryptjs";

/* ================= GET ALL USERS ================= */
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, role, balance, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= CREATE USER ================= */
export const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const exists = await pool.query(
      `SELECT * FROM users WHERE email = $1 OR username = $2`,
      [email, username]
    );

    if (exists.rows.length > 0)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role`,
      [username, email, hashedPassword, role || "user"]
    );

    res.status(201).json({
      message: "User created",
      user: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= UPDATE USER ================= */
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, role } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET username = COALESCE($1, username),
           email = COALESCE($2, email),
           role = COALESCE($3, role),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, username, email, role, balance`,
      [username, email, role, userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated", user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE USER ================= */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= CHANGE ROLE ================= */
export const changeUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const validRoles = ["user", "affiliate", "agent", "admin"];
    if (!validRoles.includes(role))
      return res.status(400).json({ message: "Invalid role" });

    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role`,
      [role, userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Role updated",
      user: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= ADMIN CREDIT / DEBIT ================= */
export const adminWalletUpdate = async (req, res) => {
  const client = await pool.connect();

  try {
    const { userId, amount, type } = req.body;

    if (!["credit", "debit"].includes(type))
      return res.status(400).json({ message: "Invalid transaction type" });

    await client.query("BEGIN");

    const userResult = await client.query(
      `SELECT balance FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    let currentBalance = Number(userResult.rows[0].balance);
    let newBalance;

    if (type === "credit") {
      newBalance = currentBalance + Number(amount);
    } else {
      if (currentBalance < Number(amount)) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Insufficient balance" });
      }
      newBalance = currentBalance - Number(amount);
    }

    await client.query(
      `UPDATE users SET balance = $1 WHERE id = $2`,
      [newBalance, userId]
    );

    await client.query(
      `INSERT INTO wallet_transactions
   (user_id, amount, type, balance_after, reason, status)
   VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, amount, type, newBalance, "admin-adjustment", "completed"]
    );

    await client.query("COMMIT");

    res.json({
      message: `Wallet ${type}ed`,
      balance: newBalance,
    });

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};