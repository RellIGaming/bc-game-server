import crypto from "crypto";
import prisma from "../prisma.js";
import redis from "../config/redis.js";
import { getIO } from "../utils/socket.js";

let multiplier = 1.0;
let interval = null;
let currentRoundId = null;
let crashPointGlobal = null;

/* ===============================
   PROVABLY FAIR
================================ */

function generateServerSeed() {
  return crypto.randomBytes(32).toString("hex");
}

function hashServerSeed(seed) {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

function calculateCrashPoint(serverSeed, clientSeed, nonce) {
  const hmac = crypto
    .createHmac("sha256", serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest("hex");

  const hashInt = parseInt(hmac.slice(0, 13), 16);

  const crash =
    (1000000 / (hashInt % 1000000)) * 0.99 / 100;

  return Math.max(1, Number(crash.toFixed(2)));
}

/* ===============================
   ROUND START
================================ */

export async function startNewRound() {
  multiplier = 1.0;

  const serverSeed = generateServerSeed();
  const serverSeedHash = hashServerSeed(serverSeed);
  const clientSeed = crypto.randomBytes(16).toString("hex");
  const nonce = 1;

  const crashPoint = calculateCrashPoint(
    serverSeed,
    clientSeed,
    nonce
  );

  const round = await prisma.crashRound.create({
    data: {
      crashPoint,
      status: "RUNNING",
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce
    }
  });

  currentRoundId = round.id;
  crashPointGlobal = crashPoint;

  await redis.set(
    "crash:current_round",
    round.id
  );

  runGame();
}

function runGame() {
  const io = getIO();
  const startTime = Date.now();

  interval = setInterval(async () => {
    const elapsed = (Date.now() - startTime) / 1000;

    multiplier = Number(Math.exp(0.06 * elapsed).toFixed(2));

    io.emit("crash:multiplier", multiplier);

    if (multiplier >= crashPointGlobal) {
      clearInterval(interval);

      io.emit("crash:crashed", crashPointGlobal);

      await prisma.crashRound.update({
        where: { id: currentRoundId },
        data: { status: "CRASHED" }
      });

      setTimeout(startNewRound, 5000);
    }
  }, 100);
}