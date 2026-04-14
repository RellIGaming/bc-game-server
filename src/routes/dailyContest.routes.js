import express from "express";
import {
  getActiveContest,
  getLeaderboard,
  getContestHistory,
  getContestRules,
  getMyContestPosition,
  getDailyContest
} from "../controllers/dailyContest.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/active", protect, getActiveContest);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/history", protect, getContestHistory);
router.get("/rules", protect, getContestRules);
router.get("/my-position", protect, getMyContestPosition);
router.get("/daily-contest", protect, getDailyContest);

export default router;