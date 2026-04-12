import express from "express";
import {
  getBonusSummary,
  claimDailyBonus,
  claimRakeback,
  getMonthlyDepositBonus,
  redeemCode
} from "../controllers/bonus.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ================= BONUS DASHBOARD ================= */
router.get("/summary", protect, getBonusSummary);
router.post("/daily/claim", protect, claimDailyBonus);
router.post("/rakeback/claim", protect, claimRakeback);
router.get("/monthly", protect, getMonthlyDepositBonus);
router.post("/redeem", protect, redeemCode);

export default router;