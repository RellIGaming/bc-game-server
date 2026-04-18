import express from "express";
import {
  getDepositTiers,
  getPromotionTabs,
  getPromotions,
  getBonusTerms
} from "../controllers/promotion.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/deposit-tiers",protect, getDepositTiers);
router.get("/tabs", protect,getPromotionTabs);
router.get("/list",protect, getPromotions);
router.get("/terms", protect,getBonusTerms);

export default router;