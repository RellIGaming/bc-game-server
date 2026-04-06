import prisma from "../prisma.js";
import { sendAgentNotification } from "../utils/socket.js";
import { nanoid } from "nanoid";

export const requestDeposit = async (req, res) => {
  try {

    const { currency, amount, method, network } = req.body;

    if (!currency || !amount || !method)
      return res.status(400).json({ message: "Missing fields" });

    const deposit = await prisma.deposit.create({
      data: {
        orderId: "ORD-" + nanoid(10),
        userId: req.user.id,
        txId: "TXN-" + nanoid(10),
        currency,
        amount,
        method,
        network,
        status: "PENDING"
      }
    });
    const agents = await prisma.user.findMany({
      where: { role: "agent" }
    });

    for (const agent of agents) {
      /* ✅ 1. SAVE TO DB */
      const notification = await prisma.notification.create({
        data: {
          agentId: agent.id, // ⚠️ later make dynamic
          type: "deposit",
          message: `New deposit request ৳${amount}`,
          read: false
        }
      });
      /* ✅ SEND NOTIFICATION TO AGENT */
      /* ✅ 2. SEND SOCKET */
      sendAgentNotification(agent.id, notification);
    }
    res.json({
      message: "Deposit request created",
      deposit
    });

  } catch (err) {
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