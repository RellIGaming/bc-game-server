import prisma from "../prisma.js";
import { updateBalance } from "../service/wallet.service.js";

// Get all wallets for user
export const getBalance = async (req, res) => {
  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId: req.user.id }
    });

    const balances = wallets.map(w => {
      const currency = w.currency || "N/A";

      return {
        id: currency.toLowerCase(),
        name: currency.toUpperCase(),
        icon: getCurrencyIcon(currency),

        // ✅ FIX HERE (IMPORTANT)
        balance: Number(w.balance),     // convert string → number
        bonus: Number(w.bonus || 0),    // convert string → number

        type: isCrypto(currency) ? "crypto" : "cash",
        isLocked: w.isLocked
      };
    });

    res.json({ data: balances });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Deposit cash
export const deposit = async (req, res) => {
  try {
    const { currency, amount } = req.body;

    const wallet = await prisma.wallet.upsert({
      where: { userId_currency: { userId: req.user.id, currency } },
      update: { balance: { increment: amount } },
      create: { userId: req.user.id, currency, balance: amount }
    });

    await prisma.walletTransaction.create({
      data: { userId: req.user.id, currency, amount, type: "DEPOSIT", status: "COMPLETED" }
    });

    res.json({ balance: wallet.balance, bonus: wallet.bonus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Withdraw cash
export const withdraw = async (req, res) => {
  try {
    const { currency, amount } = req.body;

    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId: req.user.id, currency } }
    });

    if (!wallet || wallet.balance < amount)
      return res.status(400).json({ message: "Insufficient balance" });

    const updated = await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } }
    });

    await prisma.walletTransaction.create({
      data: { userId: req.user.id, currency, amount, type: "WITHDRAW", status: "COMPLETED" }
    });

    res.json({ balance: updated.balance, bonus: updated.bonus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Bet debit
export const betDebit = async (req, res) => {
  try {
    const { currency, amount, betId } = req.body;
    const result = await updateBalance({
      userId: req.user.id,
      currency,
      amount,
      type: "BET_DEBIT",
      referenceId: betId,
      referenceType: "BET"
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Bet credit
export const betCredit = async (req, res) => {
  try {
    const { currency, amount, betId } = req.body;
    const result = await updateBalance({
      userId: req.user.id,
      currency,
      amount,
      type: "BET_WIN",
      referenceId: betId,
      referenceType: "BET_WIN"
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get last 50 transactions
export const getTransactions = async (req, res) => {
  try {
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Wallet summary
export const getSummary = async (req, res) => {
  try {
    const wallets = await prisma.wallet.findMany({ where: { userId: req.user.id } });

    const totalBalance = wallets.reduce((acc, w) => acc + Number(w.balance || 0) + Number(w.bonus || 0), 0);
const depositBalance = wallets.reduce((acc, w) => acc + Number(w.balance || 0), 0);
const bonusBalance = wallets.reduce((acc, w) => acc + Number(w.bonus || 0), 0);

    res.json({ totalBalance, depositBalance, bonusBalance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helpers
const isCrypto = (currency) => ["USDT", "BTC", "ETH", "BNB", "TRX", "LTC", "XRP", "USDC", "DOGE", "SOL", "BC", "BDT"].includes(currency.toUpperCase());

const getCurrencyIcon = (currency) => {
  const map = {
    INR: "/icons/inr.png",
    USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
    BTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
    ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    BNB: "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
    TRX: "https://cryptologos.cc/logos/tron-trx-logo.png",
    LTC: "https://cryptologos.cc/logos/litecoin-ltc-logo.png",
    XRP: "https://cryptologos.cc/logos/xrp-xrp-logo.png",
    USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
    DOGE: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
    SOL: "https://cryptologos.cc/logos/solana-sol-logo.png",
    BC: "/icons/bc.png",
    BDT: "/icons/bdt.png"
  };
  return map[currency.toUpperCase()] || "/icons/default.png";
};

export const requestDeposit = async (req, res) => {
  const { currency, amount, method } = req.body;

  const deposit = await prisma.deposit.create({
    data: {
      userId: req.user.id,
      currency,
      amount,
      method,
      status: "PENDING"
    }
  });

  res.json(deposit);
};