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
  createRound,
  forceDraw,
  getRounds,
  deleteMessage

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
router.get("/fraud/users", getFraudUsers );
router.post("/fraud/block", blockUser);
router.post("/fraud/unblock", unblockUser);
router.get("/fraud/logs", getFraudLogs);

/* ================= Promotions ================= */
router.post("/create", createPromotion);
router.delete("/:id", deletePromotion);

/* ================= Promotions ================= */
router.post("/create-round",  createRound);
router.post("/draw",  forceDraw);
router.get("/rounds",  getRounds);
router.get("/rounds",  getRounds);

/* ================= live-chat================= */
router.post("/delete", deleteMessage);



export default router;
