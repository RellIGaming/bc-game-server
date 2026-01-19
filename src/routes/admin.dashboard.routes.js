import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import {
  getDashboardStats,
  getRecentUsers,
  getRecentTransactions,
  getDailyRegistrations,
  getDailyWalletFlow,
} from "../controllers/admin.dashboard.controller.js";

const router = express.Router();

router.use(protect, isAdmin);

router.get("/stats", getDashboardStats);
router.get("/recent-users", getRecentUsers);
router.get("/recent-transactions", getRecentTransactions);
router.get("/registrations", getDailyRegistrations);
router.get("/wallet-flow", getDailyWalletFlow);

export default router;
