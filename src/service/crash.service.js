import prisma from "../prisma.js";
import redis from "../config/redis.js";
import { getIO } from "../utils/socket.js";

export async function placeCrashBet(userId, amount, autoCashout) {
  const roundId = await redis.get("crash:current_round");
  if (!roundId) throw new Error("No active round");

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.balance < amount) {
      throw new Error("Insufficient balance");
    }

    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } }
    });

    const bet = await tx.crashBet.create({
      data: {
        userId,
        roundId: Number(roundId),
        amount,
        autoCashout,
        status: "PENDING"
      }
    });

    return bet;
  });
}