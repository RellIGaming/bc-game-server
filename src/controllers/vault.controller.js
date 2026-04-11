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
      where: {
        userId_currency: {
          userId,
          currency: currency.toUpperCase()
        }
      }
    });

    if (!vault) {
      vault = await prisma.vault.create({
        data: {
          userId,
          currency: currency.toUpperCase(),
          balance: Number(amount)
        }
      });
    } else {
      vault = await prisma.vault.update({
        where: {
          userId_currency: {
            userId,
            currency: currency.toUpperCase()
          }
        },
        data: {
          balance: { increment: Number(amount) }
        }
      });
    }
    await prisma.vaultTransaction.create({
      data: {
        userId,
        type: "DEPOSIT",
        amount: Number(amount),
        currency: currency.toUpperCase()
      }
    });
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

export const runDailyInterest = async () => {
  const APR = 0.10;

  const vaults = await prisma.vault.findMany();

  for (const v of vaults) {
    const daily = (v.balance * APR) / 365;

    await prisma.vault.update({
      where: { id: v.id },
      data: {
        balance: { increment: daily }
      }
    });

    await prisma.vaultTransaction.create({
      data: {
        userId: v.userId,
        type: "INTEREST",
        amount: daily,
        currency: v.currency
      }
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

   let vault = await prisma.vault.findUnique({
      where: {
        userId_currency: {
          userId,
          currency: currency.toUpperCase()
        }
      }
    });

    if (!vault || Number(vault.balance) < Number(amount))
      return res.status(400).json({
        message: "Insufficient vault balance"
      });

    const updatedVault = await prisma.vault.update({
      where: {
        userId_currency: {
          userId,
          currency: currency.toUpperCase()
        }
      },
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
    await prisma.vaultTransaction.create({
      data: {
        userId,
        type: "WITHDRAW",
        amount: Number(amount),
        currency: currency.toUpperCase()
      }
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
/* ================= GET VAULT ================= */

export const getVault = async (req, res) => {
  try {
    const userId = req.user.id;

    const vaults = await prisma.vault.findMany({
      where: { userId }
    });

    res.json(vaults); // ✅ array
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

export const getVaultTransactions = async (req, res) => {
  const userId = req.user.id;
  const { filter } = req.query;

  let dateFilter = {};

  const now = new Date();

  if (filter === "today") {
    dateFilter = {
      gte: new Date(new Date().setHours(0, 0, 0, 0)),
    };
  }

  if (filter === "yesterday") {
    const start = new Date();
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    dateFilter = { gte: start, lte: end }; 
  }

  if (filter === "last7") {
    const start = new Date();
    start.setDate(start.getDate() - 7);

    dateFilter = { gte: start };
  }

  const data = await prisma.vaultTransaction.findMany({
    where: {
      userId,
      type: "INTEREST",
      createdAt: dateFilter,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(data);
};