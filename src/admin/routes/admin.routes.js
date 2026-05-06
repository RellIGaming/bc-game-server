import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { isAdmin } from "../../middleware/admin.middleware.js";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  adminWalletUpdate,
  updateCommission,
  getReferralConfig,
  updateReferralConfig,
  giveReferralReward,
  getReferralTree,
  getLiveRewards,
  updateBonusConfig,
  getFraudUsers,
  blockUser,
  unblockUser,
  getFraudLogs,
  createPromotion,
  deletePromotion,
  deleteMessage,
  seedContest,
  addLeaderboard,
  addHistory,
  addRule,
  addCurrency,
  createRaffleRound,
  setActiveRound,
  getAllRounds,
userDrawWinners,
  updatePromotion,
  togglePromotionStatus,
  createDepositTier,
  updateDepositTier,
  deleteDepositTier,
  createBonusCode,
  getBonusCodes,
  toggleBonusCode,
  giveUserBonus,


} from "../controller/admin.controller.js";

const router = express.Router();

router.use(protect, isAdmin);

router.get("/users", getAllUsers);
router.post("/users", createUser);
router.put("/users/:userId", updateUser);
router.delete("/users/:userId", deleteUser);

router.post("/change-role", changeUserRole);
router.post("/wallet", adminWalletUpdate);

router.post("/commission", updateCommission);

/* ================= REFERRAL CONTROL ================= */

router.get("/referral-config", getReferralConfig);
router.post("/referral-config", updateReferralConfig);

router.post("/referral/reward", giveReferralReward);
router.get("/referral-tree/:userId", getReferralTree);
router.get("/referral/live", getLiveRewards);

/* ================= BONUS CONTROL ================= */

router.post("/bonus-config", updateBonusConfig);
router.get("/fraud/users", getFraudUsers);
router.post("/fraud/block", blockUser);
router.post("/fraud/unblock", unblockUser);
router.get("/fraud/logs", getFraudLogs);



/* ================= live-chat================= */
router.post("/delete", deleteMessage);

/* ================= Daily contest ================= */
router.post("/daily-contest/seed", seedContest)
router.post("/daily-contest/leaderboard", addLeaderboard);
router.post("/daily-contest/history", addHistory);
router.post("/daily-contest/rules", addRule);
router.post("/daily-contest/currency", addCurrency);

// =================weekly raffle lucky ickey=======
// 🔹 CREATE ROUND
router.post("/raffle/create-round", createRaffleRound);
router.patch("/raffle/round/:roundId/activate", setActiveRound);
router.get("/raffle/rounds", getAllRounds);
router.post("/raffle/draw/:roundId", userDrawWinners);


// Promotions
router.post("/promotion", createPromotion);
router.put("/promotion/:id", updatePromotion);
router.delete("/promotion/:id", deletePromotion);
router.patch("/promotion/:id/toggle", togglePromotionStatus);

// Deposit tiers
router.post("/deposit-tier", createDepositTier);
router.put("/deposit-tier/:id", updateDepositTier);
router.delete("/deposit-tier/:id", deleteDepositTier);

// bonus
router.post("/bonus/code", createBonusCode);
router.get("/bonus/codes", getBonusCodes);
router.patch("/bonus/code/:id/toggle", toggleBonusCode);
router.post("/bonus/give", giveUserBonus);


export default router;
