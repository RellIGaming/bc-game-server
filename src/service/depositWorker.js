import { Worker } from "bullmq"
import prisma from "../prisma.js"
import { redis } from "../config/redis.js"

const worker = new Worker(
  "depositQueue",
  async job => {

    if (job.name === "credit-wallet") {

      const { depositId } = job.data

      const deposit = await prisma.deposit.findUnique({
        where: { id: depositId }
      })

      if (!deposit || deposit.status !== "APPROVED")
        return

      await prisma.wallet.update({
        where: {
          userId: deposit.userId
        },
        data: {
          balance: {
            increment: deposit.amount
          }
        }
      })

      await prisma.notification.create({
        data: {
          userId: deposit.userId,
          type: "deposit-approved",
          message: "Deposit credited successfully"
        }
      })

    }

  },
  { connection: redis }
)