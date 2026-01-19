import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import adminDashboardRoutes from "./routes/admin.dashboard.routes.js";
import gameRoutes from "./routes/game.routes.js";
import adminGameRoutes from "./routes/admin.game.routes.js";
import depositBonusRoutes from "./routes/depositBonus.routes.js";
import adminDepositBonusRoutes from "./routes/admin.depositBonus.routes.js";

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "https://bc-game-client.onrender.com",
    ],
    credentials: true,
  })
);

app.use(express.json());

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/admin/games", adminGameRoutes);
app.use("/api/deposit-bonus", depositBonusRoutes);
app.use("/api/admin/deposit-bonus", adminDepositBonusRoutes);
/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.json({
    status: "API running 🚀",
    env: process.env.NODE_ENV || "development",
  });
});

export default app;
