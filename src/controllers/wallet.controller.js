import prisma from "../prisma.js";
import { updateBalance } from "../service/wallet.service.js";
import { convertToBDT } from "../utils/convertCurrency.js";
import { sendAgentNotification } from "../utils/socket.js";
import { nanoid } from "nanoid";
import crypto from "crypto";
import nodemailer from "nodemailer";

export const FRONTEND_URL = "https://bc-game-client.onrender.com"

export const requestDeposit = async (req, res) => {
  try {
    const { currency, amount, method, network } = req.body;

    const allowedCurrencies = ["BDT", "INR", "PKR", "USD"];

    if (!allowedCurrencies.includes(currency)) {
      return res.status(400).json({ message: "Invalid currency" });
    }

    if (!amount || !method) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // ✅ CONVERT TO BDT
    const amountBDT = convertToBDT(amount, currency);

    const deposit = await prisma.deposit.create({
      data: {
        orderId: "ORD-" + nanoid(10),
        userId: req.user.id,
        txId: null,
        currency,
        amount,
        amountBDT,
        // originalCurrency: currency,
        // originalAmount: amount,

        method,
        network,
        status: "PENDING"
      }
    });

    const agents = await prisma.user.findMany({
      where: { role: "agent" }
    });

    for (const agent of agents) {
      const notification = await prisma.notification.create({
        data: {
          agentId: agent.id,
          type: "deposit",
          message: `New deposit request ৳${amountBDT}`,
          read: false
        }
      });

      sendAgentNotification(agent.id, notification);
    }

    res.json({
      message: "Deposit request created",
      deposit,
      paymentUrl: `${FRONTEND_URL}/payment-gateway?orderId=${deposit.orderId}&amount=${amount}&currency=${currency}&method=${method}`
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const submitDeposit = async (req, res) => {
  try {
    const { orderId, trxId } = req.body;

    // 🔒 1. Validate input
    if (!orderId || !trxId) {
      return res.status(400).json({ message: "orderId & trxId required" });
    }

    // 🔎 2. Find deposit
    const deposit = await prisma.deposit.findUnique({
      where: { orderId }
    });

    if (!deposit) {
      return res.status(404).json({ message: "Deposit not found" });
    }
    if (deposit.isSubmitted) {
      return res.status(400).json({
        message: "Already submitted"
      });
    }
    // 🚫 3. Prevent resubmission
    if (deposit.status !== "PENDING") {
      return res.status(400).json({
        message: `Deposit already ${deposit.status}`
      });
    }

    // 🔁 4. Prevent duplicate trxId (IMPORTANT)
    const existingTrx = await prisma.deposit.findFirst({
      where: { txId: trxId }
    });

    if (existingTrx) {
      return res.status(400).json({
        message: "This transaction ID already used"
      });
    }

    // 🧠 5. Update deposit
    const updated = await prisma.deposit.update({
      where: { orderId },
      data: {
        txId: trxId,
        isSubmitted: true,
        submittedAt: new Date()
      }
    });

    // 🔔 6. Notify ALL agents
    const agents = await prisma.user.findMany({
      where: { role: "agent" }
    });

    for (const agent of agents) {
      const notification = await prisma.notification.create({
        data: {
          agentId: agent.id,
          userId: deposit.userId,
          type: "deposit",
          message: `Deposit submitted ৳${deposit.amountBDT} | TRX: ${trxId}`,
          read: false
        }
      });

      // 🔥 realtime push
      sendAgentNotification(agent.id, notification);
    }

    // 📤 7. Response
    res.json({
      message: "Deposit submitted successfully",
      deposit: updated
    });

  } catch (err) {
    console.error("Submit Deposit Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const confirmCryptoDeposit = async (req, res) => {

  const { depositId, txHash } = req.body

  const deposit = await prisma.deposit.findUnique({
    where: { id: depositId }
  })

  const verified = await verifyCryptoTx(txHash)

  if (!verified)
    return res.status(400).json({
      message: "Invalid transaction"
    })

  await prisma.deposit.update({
    where: { id: depositId },
    data: {
      txHash,
      status: "APPROVED"
    }
  })
  req.io.to(`user-${deposit.userId}`).emit("deposit-approved", {
    amount: deposit.amount
  })
  await depositQueue.add("credit-wallet", {
    depositId
  })

}

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


export const sendWithdrawOtp = async (req, res) => {
  try {
    const user = req.user;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        withdrawOtp: otp,
        withdrawOtpExpiry: new Date(Date.now() + 5 * 60 * 1000),
        isWithdrawVerified: false // reset
      },
    });

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: user.email,
      subject: "Withdraw OTP Verification",
      text: `Your OTP is ${otp}`,
    });

    res.json({ message: "OTP sent to your email" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};
export const verifyWithdrawOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user.withdrawOtp || user.withdrawOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > user.withdrawOtpExpiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isWithdrawVerified: true,
        withdrawOtp: null,
        withdrawOtpExpiry: null,
      },
    });

    res.json({ message: "Withdraw verification successful" });

  } catch (err) {
    res.status(500).json({ message: "Verification failed" });
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
const isCrypto = (currency) => ["USDT", "BTC", "ETH", "BNB", "TRX", "LTC", "XRP", "USDC", "DOGE", "SOL", "BC", ].includes(currency.toUpperCase());

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

// export const requestWithdraw = async (req, res) => {

//   const { currency, amount, method, account } = req.body;

//   if (!amount || !method || !account) {
//     return res.status(400).json({ message: "All fields required" });
//   }
//   const user = await prisma.user.findUnique({
//     where: { id: req.user.id },
//   });

//   if (!user.isEmailVerified) {
//     return res.status(403).json({
//       message: "Please verify your email before withdrawal",
//     });
//   }
//   // ✅ CONVERT TO BDT
//   const amountBDT = convertToBDT(amount, currency);

//   const wallet = await prisma.wallet.findUnique({
//     where: {
//       userId_currency: {
//         userId: req.user.id,
//         currency: "BDT"
//       }
//     }
//   });

//   if (!wallet || Number(wallet.balance) < amountBDT) {
//     return res.status(400).json({ message: "Insufficient balance" });
//   }

//   const withdraw = await prisma.withdrawal.create({
//     data: {
//       orderId: "WD-" + nanoid(10),
//       userId: req.user.id,

//       // ✅ STORE ONLY BDT
//       currency: "BDT",
//       amount: amountBDT,

//       // optional
//       // originalCurrency: currency,
//       // originalAmount: amount,

//       method,
//       account
//     }
//   });

//   const agents = await prisma.user.findMany({
//     where: { role: "agent" }
//   });

//   for (const agent of agents) {
//     const notification = await prisma.notification.create({
//       data: {
//         userId: req.user.id,
//         agentId: agent.id,
//         type: "withdraw",
//         message: `New withdraw request ৳${amountBDT}`,
//         read: false
//       }
//     });

//     sendAgentNotification(agent.id, notification);
//   }

//   res.json(withdraw);
// };

export const requestWithdraw = async (req, res) => {
  const { currency, amount, method, account, accountHolderName } = req.body;

  if (!amount || !method || !account || !accountHolderName) {
    return res.status(400).json({ message: "All fields required" });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  // ✅ MUST VERIFY OTP FIRST
  if (!user.isWithdrawVerified) {
    return res.status(403).json({
      message: "Please verify OTP before withdrawal"
    });
  }

  // ✅ DAILY LIMIT
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.withdrawal.findFirst({
    where: {
      userId: user.id,
      createdAt: { gte: today }
    }
  });

  if (existing) {
    return res.status(400).json({
      message: "Only 1 withdrawal allowed per day"
    });
  }

  const amountBDT = convertToBDT(amount, currency);

  const wallet = await prisma.wallet.findUnique({
    where: {
      userId_currency: {
        userId: user.id,
        currency: "BDT"
      }
    }
  });

  if (!wallet || Number(wallet.balance) < amountBDT) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  const withdraw = await prisma.withdrawal.create({
    data: {
      orderId: "WD-" + nanoid(10),
      userId: user.id,
      currency: "BDT",
      amount: amountBDT,
      method,
      account,
      accountHolderName
    }
  });

  // ✅ RESET VERIFICATION AFTER SUCCESS
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isWithdrawVerified: false
    }
  });

  // 🔥 SOCKET NOTIFICATION
  const agents = await prisma.user.findMany({
    where: { role: "agent" }
  });

  for (const agent of agents) {
    sendAgentNotification(agent.id, {
      type: "withdraw",
      message: `New withdraw ৳${amountBDT}`,
      withdrawId: withdraw.id
    });
  }

  res.json(withdraw);
};