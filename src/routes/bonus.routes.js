import express from "express";
import {
  getBonusSummary,
  claimDailyBonus,
  claimRakeback,
  getMonthlyDepositBonus,
  redeemCode,
  getBonusFull,
  seedBonusTestData,
  getVipLevels,
  getVipClub,
  getVipBonusTable
} from "../controllers/bonus.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { getActiveDepositBonus } from "../controllers/depositBonus.controller.js";

const router = express.Router();

/* ================= BONUS DASHBOARD ================= */

router.get("/deposit-bonus", protect, getActiveDepositBonus);
router.get("/summary", protect, getBonusSummary);
router.post("/daily/claim", protect, claimDailyBonus);
router.post("/rakeback/claim", protect, claimRakeback);
router.get("/monthly", protect, getMonthlyDepositBonus);
router.post("/redeem", protect, redeemCode);
router.get("/full", protect, getBonusFull);
router.post("/test-seed", protect, seedBonusTestData);
router.get("/vip-levels", getVipLevels);

router.get("/vip-club", getVipClub);
router.get("/vip-table", getVipBonusTable);




export default router;