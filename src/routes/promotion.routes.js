import express from "express";
import {
  getDepositTiers,
  getPromotionTabs,
  getPromotions,
  getBonusTerms
} from "../controllers/promotion.controller.js";

const router = express.Router();

router.get("/deposit-tiers", getDepositTiers);
router.get("/tabs", getPromotionTabs);
router.get("/list", getPromotions);
router.get("/terms", getBonusTerms);

export default router;