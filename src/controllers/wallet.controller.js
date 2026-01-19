// controllers/wallet.controller.js
import User from "../models/User.model.js";
import WalletTransaction from "../models/WalletTransaction.js";

/* ================= GET BALANCE ================= */
export const getBalance = async (req, res) => {
  res.json({ balance: req.user.balance });
};

/* ================= CREDIT WALLET ================= */
export const creditWallet = async (req, res) => {
  const { amount, reason, reference } = req.body;

  if (amount <= 0)
    return res.status(400).json({ message: "Invalid amount" });

  const user = await User.findById(req.user._id);

  user.balance += amount;
  await user.save();

  await WalletTransaction.create({
    user: user._id,
    amount,
    type: "credit",
    balanceAfter: user.balance,
    reason,
    reference,
  });

  res.json({
    message: "Wallet credited",
    balance: user.balance,
  });
};

/* ================= DEBIT WALLET ================= */
export const debitWallet = async (req, res) => {
  const { amount, reason, reference } = req.body;

  if (amount <= 0)
    return res.status(400).json({ message: "Invalid amount" });

  const user = await User.findById(req.user._id);

  if (user.balance < amount)
    return res.status(400).json({ message: "Insufficient balance" });

  user.balance -= amount;
  await user.save();

  await WalletTransaction.create({
    user: user._id,
    amount,
    type: "debit",
    balanceAfter: user.balance,
    reason,
    reference,
  });

  res.json({
    message: "Wallet debited",
    balance: user.balance,
  });
};

/* ================= TRANSACTION HISTORY ================= */
export const getTransactions = async (req, res) => {
  const txns = await WalletTransaction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(txns);
};
