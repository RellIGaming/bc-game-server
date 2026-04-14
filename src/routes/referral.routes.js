import express from "express";
import { getReferralFriends ,getReferralEarnings,getReferralDashboard, 
    createTestReferralReward,
getRewardsSummary,
getCommissionByFriends,
getCommissionByCurrency,
getLevelUpRewards,
getRewardHistory,
getReferralCodes,
createReferralCode,
getCommissionRules,
calculateCommission,
getReferralVipLevels,
getReferralProgress,

} from "../controllers/referral.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();


router.get("/friends", protect, getReferralFriends);
router.get("/earnings", protect, getReferralEarnings);
router.get("/dashboard", protect, getReferralDashboard);
router.post("/test-reward", protect, createTestReferralReward);
router.get("/rewards/summary", protect, getRewardsSummary);
router.get("/rewards/friends", protect, getCommissionByFriends);
router.get("/rewards/currency", protect, getCommissionByCurrency);
router.get("/rewards/level", protect, getLevelUpRewards);
router.get("/rewards/history", protect, getRewardHistory);
router.get("/codes", protect, getReferralCodes);
router.post("/create-codes", protect, createReferralCode);

router.get("/commission-rules", getCommissionRules);
router.post("/commission-calc", calculateCommission);
router.get("/vip-levels", getReferralVipLevels);
router.get("/progress", getReferralProgress);


export default router;