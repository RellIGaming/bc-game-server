import prisma from "../prisma.js";
import { nanoid } from "nanoid";
import { sendAgentNotification } from "../utils/socket.js";
/* ================= REQUEST WITHDRAW ================= */

// POST /api/withdraw/request
export const requestWithdraw = async (req, res) => {

  const { currency, amount, method, account } = req.body

  const wallet = await prisma.wallet.findUnique({
    where: {
      userId_currency: {
        userId: req.user.id,
        currency
      }
    }
  })
  if (!currency || !amount || !method || !account) {
    return res.status(400).json({ message: "All fields required" });
  }
  if (!wallet || Number(wallet.balance) < Number(amount)) {
    return res.status(400).json({ message: "Insufficient balance" });
  }


  const withdraw = await prisma.withdrawal.create({
    data: {
      orderId: "WD-" + nanoid(10),
      userId: req.user.id,
      currency,
      method,
      account,
      amount
    }
  })
  const agents = await prisma.user.findMany({
  where: { role: "agent" }
});

for (const agent of agents) {
  const notification = await prisma.notification.create({
  data: {
    userId: req.user.id,
    agentId: agent.id,
    type: "withdraw",
    message: `New withdraw request ৳${amount}`,
    read: false
  }
});

sendAgentNotification(agent.id, notification);
}
  res.json(withdraw)
}