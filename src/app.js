import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./admin/routes/admin.routes.js";
import adminDashboardRoutes from "./admin/routes/admin.dashboard.routes.js";
import gameRoutes from "./routes/game.routes.js";
import adminGameRoutes from "./admin/routes/admin.game.routes.js";
import adminWalletRoutes from "./admin/routes/admin.wallet.routes.js";
import adminDepositBonusRoutes from "./admin/routes/admin.depositBonus.routes.js";
import sidebarRoutes from "./routes/sidebar.routes.js";
import betRoutes from "./routes/bet.routes.js";
import tokenRoutes from "./routes/token.routes.js";
import matchRoutes from "./routes/match.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import sportsRoutes from "./routes/sports.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import depositRoutes from "./routes/deposit.routes.js";
import withdrawRoutes from "./routes/withdraw.routes.js";
import vaultRoutes from "./routes/vault.routes.js";
import swapRoutes from "./routes/swap.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import marketRoutes from "./routes/market.routes.js";
import agentWalletRoutes from "./agent/routes/walletRoutes.js";
import notificationRoutes from "./routes/notification.routes.js";

import path from "path";

const app = express();

app.use("/images", express.static(path.join(process.cwd(), "public/images")));
/* ================= MIDDLEWARE ================= */
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://localhost:5173",
      "https://bc-game-client.onrender.com",
    ],
    credentials: true,
  })
);

app.use(express.json());

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/sidebar", sidebarRoutes);
app.use("/api/bets", betRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/matches", matchRoutes);
app.use('api/leaderboard', leaderboardRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/markets', marketRoutes)
app.use("/api/wallet", walletRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/swap", swapRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/notifications", notificationRoutes);

// admin api
app.use("/api/admin", adminRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/games", adminGameRoutes);
app.use("/api/admin/deposit-bonus", adminDepositBonusRoutes);
app.use("/api/admin/wallet", adminWalletRoutes);

// agent api
app.use("/api/agent", agentWalletRoutes);



/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.json({
    status: "API running 🚀",
    env: process.env.NODE_ENV || "development",
  });
});

export default app;
