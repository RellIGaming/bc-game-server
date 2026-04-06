import prisma from "../prisma.js";
import { updateBalance } from "../service/wallet.service.js";


export const swapCrypto = async (req, res) => {
  try {

    if (!req.body) {
      return res.status(400).json({
        message: "Request body missing"
      });
    }

    const { from, to, amount, rate } = req.body;

    if (!from || !to || !amount || !rate) {
      return res.status(400).json({
        message: "Missing swap parameters"
      });
    }

    const userId = req.user.id;

    const amountNum = Number(amount);
    const receive = Number(amount) * Number(rate);

    const refId = `SWAP_${Date.now()}`;

    /* DEBIT SOURCE WALLET */

    await updateBalance({
      userId,
      currency: from.toUpperCase(),
      amount: amountNum,
      type: "BET_DEBIT",
      referenceId: refId,
      referenceType: "SWAP_OUT"
    });

    /* CREDIT TARGET WALLET */

    await updateBalance({
      userId,
      currency: to.toUpperCase(),
      amount: receive,
      type: "BET_WIN",
      referenceId: refId,
      referenceType: "SWAP_IN"
    });

    /* STORE SWAP RECORD */

    await prisma.swap.create({
      data: {
        userId,
        fromCurrency: from.toUpperCase(),
        toCurrency: to.toUpperCase(),
        amountFrom: amountNum,
        amountTo: receive
      }
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