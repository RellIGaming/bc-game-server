import pool from "../../config/db.js";
import bcrypt from "bcryptjs";
import prisma from "../../prisma.js";
import { drawWinners } from "../../service/raffleDraw.service.js";

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

// GET /admin/referral-config
export const getReferralConfig = async (req, res) => {
  const config = await prisma.referralConfig.findFirst();
  res.json(config);
};

// POST /admin/referral-config
export const updateReferralConfig = async (req, res) => {
  const { level1, level2, level3 } = req.body;

  const data = await prisma.referralConfig.upsert({
    where: { id: 1 },
    update: { level1, level2, level3 },
    create: { id: 1, level1, level2, level3 }
  });

  res.json(data);
};
export const updateBonusConfig = async (req, res) => {
  const { dailyBonus, rakebackRate, signupBonus } = req.body;

  const data = await prisma.bonusConfig.upsert({
    where: { id: 1 },
    update: { dailyBonus, rakebackRate, signupBonus },
    create: { id: 1, dailyBonus, rakebackRate, signupBonus }
  });

  res.json(data);
};
 //  PATCH /admin/commission
export const updateCommission = async (req, res) => {
  const { gameType, baseRate, gameRate, level1, level2, level3 } = req.body;

  const data = await prisma.commissionSetting.upsert({
    where: { gameType },
    update: { baseRate, gameRate, level1, level2, level3 },
    create: { gameType, baseRate, gameRate, level1, level2, level3 }
  });

  res.json(data);
};

// POST /admin/referral/reward
export const giveReferralReward = async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid input" });
  }

  if (amount > 10000) {
    return res.status(400).json({
      message: "Too large reward 🚨"
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: {
        userId_currency: { userId: BigInt(userId), currency: "INR" }
      },
      data: {
        bonus: { increment: Number(amount) }
      }
    });

    await tx.walletTransaction.create({
      data: {
        userId: BigInt(userId),
        amount: Number(amount),
        currency: "INR",
        type: "REFERRAL_REWARD",
        referenceType: "REFERRAL",
        status: "COMPLETED"
      }
    });
  });

  res.json({ message: "Reward added ✅" });
};

// GET /admin/referral-tree/:userId
export const getReferralTree = async (req, res) => {
  const { userId } = req.params;

  const level1 = await prisma.user.findMany({
    where: { referredBy: BigInt(userId) },
    select: { id: true, username: true }
  });

  const level2 = await prisma.user.findMany({
    where: {
      referredBy: { in: level1.map(u => u.id) }
    },
    select: { id: true, username: true }
  });

  const level3 = await prisma.user.findMany({
    where: {
      referredBy: { in: level2.map(u => u.id) }
    },
    select: { id: true, username: true }
  });

  res.json({
    level1,
    level2,
    level3
  });
};
// GET /admin/live-rewards
export const getLiveRewards = async (req, res) => {
  const data = await prisma.walletTransaction.findMany({
    where: { referenceType: "REFERRAL" },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  res.json(data);
};

export const getFraudUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    where: { fraudScore: { gte: 50 } },
    orderBy: { fraudScore: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      fraudScore: true
    }
  });

  res.json(users);
};

export const blockUser = async (req, res) => {
  const { userId } = req.body;

  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { status: "BLOCKED" }
  });

  res.json({ message: "User blocked 🚫" });
};

export const unblockUser = async (req, res) => {
  const { userId } = req.body;

  await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { status: "ACTIVE" }
  });

  res.json({ message: "User unblocked ✅" });
};
export const getFraudLogs = async (req, res) => {
  const logs = await prisma.fraudLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });

  res.json(logs);
};

export const createPromotion = async (req, res) => {
  try {
    const { title, sub, endsAt, categories, badge } = req.body;

    const promo = await prisma.promotion.create({
      data: {
        title,
        sub,
        endsAt: new Date(endsAt),
        categories,
        badge,
      },
    });

    res.json(promo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.promotion.delete({
      where: { id: Number(id) },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ============Ruffel Draw=============

export const createRound = async (req, res) => {
  const { startAt, endAt, drawAt } = req.body;

  const roundId = Date.now().toString();

  const round = await prisma.raffleRound.create({
    data: {
      roundId,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      drawAt: new Date(drawAt),
    },
  });

  res.json(round);
};

export const forceDraw = async (req, res) => {
  await drawWinners();
  res.json({ message: "Draw completed" });
};

export const getRounds = async (req, res) => {
  const rounds = await prisma.raffleRound.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json(rounds);
};

// ========== live- chat=======

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.body;

    // ✅ Only admin allowed
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Soft delete
    await prisma.chatMessage.update({
      where: { id },
      data: {
        isDeleted: true,
        message: "This message was deleted by admin",
      },
    });

    // 🔥 Emit realtime delete
    const io = getIO();
    io.to(message.room).emit("message-deleted", { id });

    res.json({ message: "Message deleted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};