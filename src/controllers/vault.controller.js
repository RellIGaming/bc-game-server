import prisma from "../prisma.js";
import { updateBalance } from "../service/wallet.service.js";

/* ================= DEPOSIT VAULT ================= */

export const vaultDeposit = async (req, res) => {
  try {

    const { currency, amount } = req.body;
    const userId = req.user.id;

    if (!currency)
      return res.status(400).json({ message: "Currency is required" });

    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Invalid amount" });

    // debit wallet → move money to vault
    const walletBalance = await updateBalance({
      userId,
      currency: currency.toUpperCase(),   // ✅ REQUIRED
      amount: Number(amount),
      type: "WITHDRAW",
      referenceId: `VAULT_DEP_${Date.now()}`,
      referenceType: "VAULT_DEPOSIT"
    });

    let vault = await prisma.vault.findUnique({
      where: { userId }
    });

    if (!vault) {
      vault = await prisma.vault.create({
        data: {
          userId,
          balance: Number(amount)
        }
      });
    } else {
      vault = await prisma.vault.update({
        where: { userId },
        data: {
          balance: { increment: Number(amount) }
        }
      });
    }

    res.json({
      success: true,
      walletBalance,
      vaultBalance: vault.balance
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};


/* ================= WITHDRAW VAULT ================= */

export const vaultWithdraw = async (req, res) => {
  try {

    const { currency, amount } = req.body;
    const userId = req.user.id;

    if (!currency)
      return res.status(400).json({ message: "Currency is required" });

    const vault = await prisma.vault.findUnique({
      where: { userId }
    });

    if (!vault || Number(vault.balance) < Number(amount))
      return res.status(400).json({
        message: "Insufficient vault balance"
      });

    const updatedVault = await prisma.vault.update({
      where: { userId },
      data: {
        balance: { decrement: Number(amount) }
      }
    });

    const walletBalance = await updateBalance({
      userId,
      currency: currency.toUpperCase(),
      amount: Number(amount),
      type: "DEPOSIT",
      referenceId: `VAULT_WD_${Date.now()}`,
      referenceType: "VAULT_WITHDRAW"
    });

    res.json({
      success: true,
      walletBalance,
      vaultBalance: updatedVault.balance
    });

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};