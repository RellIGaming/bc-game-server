import express from "express";
import {
  getBonusSummary,
  claimDailyBonus,
  claimRakeback,
  getMonthlyDepositBonus,
  redeemCode,
  getBonusFull,
  seedBonusTestData
} from "../controllers/bonus.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ================= BONUS DASHBOARD ================= */
router.get("/summary", protect, getBonusSummary);
router.post("/daily/claim", protect, claimDailyBonus);
router.post("/rakeback/claim", protect, claimRakeback);
router.get("/monthly", protect, getMonthlyDepositBonus);
router.post("/redeem", protect, redeemCode);
router.get("/full", protect, getBonusFull);
router.post("/test-seed", protect, seedBonusTestData);

export default router;