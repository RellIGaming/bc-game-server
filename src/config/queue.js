import { Queue } from "bullmq"
import { redis } from "./redis.js"

export const depositQueue = new Queue("depositQueue", {
  connection: redis
})