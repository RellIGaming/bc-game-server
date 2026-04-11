import prisma from "../prisma.js";
import { updateBalance } from "../service/wallet.service.js";


export const swapCrypto = async (req, res) => {
  try {
    const { from, to, amount, rate } = req.body;

    if (!from || !to || !amount || !rate) {
      return res.status(400).json({
        message: "Missing swap parameters"
      });
    }

    const userId = req.user.id;

    const amountNum = Number(amount);
    const receive = amountNum * Number(rate);

    const refId = `SWAP_${Date.now()}`;

    await prisma.$transaction(async (tx) => {

      // 🔹 check balance first
      const fromWallet = await tx.wallet.findUnique({
        where: {
          userId_currency: {
            userId,
            currency: from.toUpperCase()
          }
        }
      });

      if (!fromWallet || Number(fromWallet.balance) < amountNum) {
        throw new Error("Insufficient balance");
      }

      // 🔹 debit
      const beforeDebit = Number(fromWallet.balance);

      await tx.wallet.update({
        where: {
          userId_currency: {
            userId,
            currency: from.toUpperCase()
          }
        },
        data: {
          balance: { decrement: amountNum }
        }
      });

      // 🔹 credit
      const toWallet = await tx.wallet.upsert({
        where: {
          userId_currency: {
            userId,
            currency: to.toUpperCase()
          }
        },
        update: {
          balance: { increment: receive }
        },
        create: {
          userId,
          currency: to.toUpperCase(),
          balance: receive
        }
      });

      // 🔹 transaction logs (VERY IMPORTANT)
      await tx.walletTransaction.create({
        data: {
          userId,
          currency: from.toUpperCase(),
          amount: amountNum,
          type: "SWAP",
          status: "COMPLETED",
          balanceBefore: beforeDebit,
          balanceAfter: beforeDebit - amountNum,
          referenceId: refId,
          referenceType: "SWAP_OUT"
        }
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          currency: to.toUpperCase(),
          amount: receive,
          type: "SWAP",
          status: "COMPLETED",
          balanceBefore: Number(toWallet.balance) - receive,
          balanceAfter: Number(toWallet.balance),
          referenceId: refId,
          referenceType: "SWAP_IN"
        }
      });

      // 🔹 store swap history
      await tx.swap.create({
        data: {
          userId,
          fromCurrency: from.toUpperCase(),
          toCurrency: to.toUpperCase(),
          amountFrom: amountNum,
          amountTo: receive
        }
      });

    });

    res.json({
      success: true,
      from,
      to,
      sent: amountNum,
      received: receive
    });

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

export const getSwapBalance = async (req, res) => {
  try {

    const wallets = await prisma.wallet.findMany({
      where: { userId: req.user.id }
    });

    const balances = wallets.map(w => ({
      currency: w.currency,
      balance: Number(w.balance)
    }));

    res.json({ balances });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }
};

export const getSwapRate = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "Missing params" });
    }

    // 🔥 simple static rates (you can later replace with real API)
    const rates = {
      INR_USDT: 0.012,
      BDT_USDT: 0.0091,
      USDT_BDT: 110,
      USDT_INR: 83,
    };

    const key = `${from.toUpperCase()}_${to.toUpperCase()}`;

    const rate = rates[key];

    if (!rate) {
      return res.status(400).json({ message: "Rate not available" });
    }

    res.json({ rate });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

