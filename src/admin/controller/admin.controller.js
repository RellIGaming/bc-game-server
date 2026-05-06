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

// ========== Daily contest by admin==========

// ================= SEED CONTEST =================
export const seedContest = async (req, res) => {
  try {
    const contest = await prisma.dailyContest.create({
      data: {
        title: "Daily Contest",
        prizePool: 5000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true,

        leaderboard: {
          create: [
            {
              playerName: "TestUser",
              wager: 10000,
              prize: 5000,
              rank: 1
            }
          ]
        },

        histories: {
          create: [
            {
              playerName: "LastWinner",
              wager: 20000,
              prize: 10000,
              rank: 1
            }
          ]
        }
      }
    });

    res.json(contest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= ADD LEADERBOARD =================
export const addLeaderboard = async (req, res) => {
  try {
    const { contestId,userId, playerName, wager, prize, rank } = req.body;

     if (!contestId || !playerName || !userId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const data = await prisma.dailyContestLeaderboard.create({
      data: {
        contestId: Number(contestId),
        userId: Number(userId),
        playerName,
        wager: Number(wager || 0),
        prize: Number(prize || 0),
        rank: Number(rank || 0)
      }
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= ADD HISTORY =================
export const addHistory = async (req, res) => {
  try {
    const { contestId, playerName, wager, prize, rank } = req.body;

    const data = await prisma.dailyContestHistory.create({
      data: {
        contestId: Number(contestId),
        playerName,
        wager: Number(wager || 0),
        prize: Number(prize || 0),
        rank: Number(rank || 0)
      }
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= ADD RULE =================
export const addRule = async (req, res) => {
  try {
    const { content, order } = req.body;

    const data = await prisma.dailyContestRule.create({
      data: {
        content,
        order: Number(order || 0)
      }
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= ADD CURRENCY =================
export const addCurrency = async (req, res) => {
  try {
    const { groupText, order } = req.body;

    const data = await prisma.dailyContestCurrency.create({
      data: {
        groupText,
        order: Number(order || 0)
      }
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// weekly raffle -lucky ticket =====


// ✅ CREATE NEW RAFFLE ROUND
export const createRaffleRound = async (req, res) => {
  try {
    const { roundId, prizePool, totalTickets, startAt, endAt, drawAt } = req.body;

    const round = await prisma.raffleRound.create({
      data: {
        roundId,
        prizePool,
        totalTickets,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        drawAt: new Date(drawAt),
        status: "ACTIVE",
      },
    });

    res.json(round);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create round" });
  }
};

// ✅ SET ACTIVE ROUND
export const setActiveRound = async (req, res) => {
  try {
    const { roundId } = req.params;

    // deactivate all
    await prisma.raffleRound.updateMany({
      data: { status: "DRAWN" },
    });

    // activate selected
    const round = await prisma.raffleRound.update({
      where: { roundId },
      data: { status: "ACTIVE" },
    });

    res.json({ message: "Round activated", round });
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};

// ✅ GET ALL ROUNDS
export const getAllRounds = async (req, res) => {
  try {
    const rounds = await prisma.raffleRound.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(rounds);
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};

// ✅ DRAW WINNERS
export const userDrawWinners = async (req, res) => {
  try {
    const { roundId } = req.params;

    const existing = await prisma.raffleWinner.findFirst({
      where: { roundId },
    });

    if (existing) {
      return res.status(400).json({ message: "Already drawn" });
    }

    const tickets = await prisma.raffleTicket.findMany({
      where: { roundId },
    });

    if (!tickets.length) {
      return res.status(400).json({ message: "No tickets found" });
    }

    const round = await prisma.raffleRound.findUnique({
      where: { roundId },
    });

    const totalPrize = Number(round.prizePool);

    const shuffled = tickets.sort(() => 0.5 - Math.random());
    const winners = shuffled.slice(0, 10);

    const distribution = [50, 20, 10, 5, 5, 3, 3, 2, 1, 1];

    const result = await prisma.$transaction(async (tx) => {
      const created = [];

      for (let i = 0; i < winners.length; i++) {
        const ticket = winners[i];
        const prize = (totalPrize * distribution[i]) / 100;

        await tx.raffleTicket.update({
          where: { id: ticket.id },
          data: {
            isWinner: true,
            prize,
          },
        });

        const winner = await tx.raffleWinner.create({
          data: {
            userId: ticket.userId,
            roundId,
            ticketNo: ticket.ticketNumber,
            prize,
          },
        });

        created.push(winner);
      }

      // ✅ mark round complete
      await tx.raffleRound.update({
        where: { roundId },
        data: { status: "DRAWN" },
      });

      return created;
    });

    res.json({
      message: "Winners drawn successfully",
      winners: result,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Draw failed" });
  }
};

//=============Promotions=========
export const createPromotion = async (req, res) => {
  try {
    const { title, subtitle, endsAt, categories, badge } = req.body;

    const promo = await prisma.promotion.create({
      data: {
        title,
        subtitle,
        endsAt: new Date(endsAt),
        categories, // array ["Casino","Sports"]
        badge
      }
    });

    res.json(promo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const promo = await prisma.promotion.update({
      where: { id: Number(id) },
      data: {
        ...data,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined
      }
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
      where: { id: Number(id) }
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const togglePromotionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const promo = await prisma.promotion.findUnique({
      where: { id: Number(id) }
    });

    const updated = await prisma.promotion.update({
      where: { id: Number(id) },
      data: {
        status: promo.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE"
      }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const createDepositTier = async (req, res) => {
  try {
    const { percentage, label, minAmount, order } = req.body;

    const tier = await prisma.depositBonusTier.create({
      data: {
        percentage,
        label,
        minAmount,
        order
      }
    });

    res.json(tier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const updateDepositTier = async (req, res) => {
  try {
    const { id } = req.params;

    const tier = await prisma.depositBonusTier.update({
      where: { id: Number(id) },
      data: req.body
    });

    res.json(tier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const deleteDepositTier = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.depositBonusTier.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//===============Bonus============

/* ================= CREATE BONUS CODE ================= */
export const createBonusCode = async (req, res) => {
  try {
    const { code, amount } = req.body;

    const newCode = await prisma.bonusCode.create({
      data: { code, amount }
    });

    res.json(newCode);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET ALL BONUS CODES ================= */
export const getBonusCodes = async (req, res) => {
  try {
    const codes = await prisma.bonusCode.findMany({
      orderBy: { createdAt: "desc" }
    });

    res.json(codes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= TOGGLE CODE ================= */
export const toggleBonusCode = async (req, res) => {
  try {
    const { id } = req.params;

    const code = await prisma.bonusCode.update({
      where: { id },
      data: {
        isActive: { set: false }
      }
    });

    res.json(code);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= MANUAL BONUS ================= */
export const giveUserBonus = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    await prisma.$transaction(async (tx) => {
      await tx.walletTransaction.create({
        data: {
          userId,
          currency: "INR",
          amount,
          type: "DEPOSIT",
          status: "COMPLETED",
          referenceType: "ADMIN_BONUS"
        }
      });

      await tx.wallet.update({
        where: {
          userId_currency: { userId, currency: "INR" }
        },
        data: {
          bonus: { increment: amount }
        }
      });
    });

    res.json({ message: "Bonus given ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};