import redis from "../config/redis.js"
import prisma from "../prisma.js"
import { nanoid } from "nanoid"

export const createDeposit = async (userId, data) => {

  const { currency, method, network, amount } = data

  const lockKey = `deposit-lock:${userId}`

  const locked = await redis.set(lockKey, "1", "EX", 5, "NX")

  if (!locked) {
    throw new Error("Duplicate deposit request")
  }

  const deposit = await prisma.deposit.create({
    data: {
      orderId: "ORD-" + nanoid(10),
      userId,
      currency,
      method,
      network,
      amount
    }
  })

  return deposit
}