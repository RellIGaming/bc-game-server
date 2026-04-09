import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL, {
  // host: "127.0.0.1",
  // port: 6379,
  enableReadyCheck: false,
  maxRetriesPerRequest: null, // prevent crash
});

redis.on("connect", () => {
  console.log("✅ Redis Connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export default redis;