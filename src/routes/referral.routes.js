import express from "express";
import { getReferralFriends ,getReferralEarnings,getReferralDashboard, createTestReferralReward} from "../controllers/referral.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();


router.get("/friends", protect, getReferralFriends);
router.get("/earnings", protect, getReferralEarnings);
router.get("/dashboard", protect, getReferralDashboard);
router.post("/test-reward", protect, createTestReferralReward);
export default router;