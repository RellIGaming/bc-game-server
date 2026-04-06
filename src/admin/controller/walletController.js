import prisma from "../../prisma.js";
import { updateBalance } from "../../service/wallet.service.js";


// Admin can approve if agent inactive.

// GET /api/admin/transactions


// POST /api/admin/deposit/approve

// POST /api/admin/withdraw/approve
// POST /api/admin/set-agent-wallet
export const setAgentWallet = async (req, res) => {
  try {
    const { agentId, currency, amount } = req.body;

    if (!agentId || !currency || amount == null) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const wallet = await prisma.wallet.upsert({
      where: {
        userId_currency: {
          userId: agentId,
          currency
        }
      },
      update: {
        balance: amount
      },
      create: {
        userId: agentId,
        currency,
        balance: amount
      }
    });

    res.json({
      message: "Agent wallet updated",
      wallet
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= ALL DEPOSITS ================= */


export const getDeposits = async (req, res) => {

  const deposits = await prisma.deposit.findMany({
    orderBy: { createdAt: "desc" }
  });

  res.json(deposits);
};


/* ================= APPROVE DEPOSIT ================= */

export const approveDeposit = async (req, res) => {

  const { depositId } = req.body;

  const deposit = await prisma.deposit.findUnique({
    where: { id: depositId }
  });

  await updateBalance({
    userId: deposit.userId,
    amount: deposit.amount,
    currency:deposit.currency,
    type: "DEPOSIT",
    referenceId: deposit.id.toString(),
    referenceType: "DEPOSIT"
  });

  await prisma.deposit.update({
    where: { id: depositId },
    data: { status: "APPROVED" }
  });

  res.json({ success: true });
};


/* ================= APPROVE WITHDRAW ================= */

export const approveWithdraw = async (req, res) => {

  const { withdrawId } = req.body;

  const withdraw = await prisma.withdrawal.findUnique({
    where: { id: withdrawId }
  });

  await updateBalance({
    userId: withdraw.userId,
    amount: withdraw.amount,
    currency:withdraw.currency,
    type: "WITHDRAW",
    referenceId: withdraw.id.toString(),
    referenceType: "WITHDRAW"
  });

  await prisma.withdrawal.update({
    where: { id: withdrawId },
    data: { status: "COMPLETED" }
  });

  res.json({ success: true });
};


/* ================= ADMIN CREDIT ================= */

export const adminCredit = async (req, res) => {

  const { userId, amount } = req.body;

  await updateBalance({
    userId,
    amount,
    type: "CREDIT",
    referenceType: "ADMIN"
  });

  res.json({ success: true });
};