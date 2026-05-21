import prisma from "../../prisma.js";
import { updateBalance } from "../../service/wallet.service.js";


export const setExchangeRate = async (req, res) => {
  try {
    const { currency, rate } = req.body;

    if (!currency || !rate) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const data = await prisma.exchangeRate.upsert({
      where: { currency },
      update: { rate },
      create: { currency, rate }
    });

    res.json({
      message: "Rate updated",
      data
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Admin can approve if agent inactive.

// GET /api/admin/transactions


// POST /api/admin/deposit/approve

// POST /api/admin/withdraw/approve
// POST /api/admin/set-agent-wallet


export const setAgentWallet = async (req, res) => {
  try {
    const { agentId, amount, currency } = req.body;

    if (!agentId || !currency) {
      return res.status(400).json({
        message: "agentId and currency required"
      });
    }

    const wallet = await prisma.wallet.upsert({
      where: {
        userId_currency: {
          userId: agentId,
          currency: currency.toUpperCase()
        }
      },
      update: {
        balance: amount
      },
      create: {
        userId: agentId,
        currency: currency.toUpperCase(),
        balance: amount
      }
    });

    res.json({
      message: `Agent wallet updated (${currency.toUpperCase()})`,
      wallet
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};
/* ================= ALL DEPOSITS ================= */


export const getDeposits = async (req, res) => {

  const deposits = await prisma.deposit.findMany({
    orderBy: { createdAt: "desc" }
  });

  res.json(deposits);
};


/* ================= APPROVE DEPOSIT by admin ================= */

// export const approveDeposit = async (req, res) => {

//   const { depositId } = req.body;

//   const deposit = await prisma.deposit.findUnique({
//     where: { id: depositId }
//   });
// if (deposit.agentId) {
//   return res.status(400).json({ message: "Already handled by agent" });
// }
//   await updateBalance({
//     userId: deposit.userId,
//     amount: deposit.amount,
//     currency: "BDT",
//     type: "DEPOSIT",
//     referenceId: deposit.id.toString(),
//     referenceType: "DEPOSIT"
//   });

//   await prisma.deposit.update({
//     where: { id: depositId },
//     data: { status: "APPROVED" }
//   });

//   res.json({ success: true });
// };

export const approveDeposit = async (req, res) => {

  const { depositId } = req.body;

  const deposit = await prisma.deposit.findUnique({
    where: { id: depositId }
  });

  if (deposit.agentId) {
    return res.status(400).json({ message: "Handled by agent" });
  }

  const amount = Number(deposit.amountBDT); // ✅ FIX

  await updateBalance({
    userId: deposit.userId,
    amount,
    currency: "BDT",
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
/* ================= APPROVE WITHDRAW by admin ================= */

export const approveWithdraw = async (req, res) => {

  const { withdrawId } = req.body;

  const withdraw = await prisma.withdrawal.findUnique({
    where: { id: withdrawId }
  });
const amountBDT = convertToBDT(amount, currency);
  await updateBalance({
    userId: withdraw.userId,
    amount: amountBDT,
    currency: "BDT",
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