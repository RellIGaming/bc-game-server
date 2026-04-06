// routes/wallet.routes.js
import express from "express";
import {
  getBalance,
  betDebit,
  betCredit,
  getTransactions,getSummary,deposit,withdraw
} from "../controllers/wallet.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/balance", protect, getBalance);

router.post("/bet-debit", protect, betDebit);

router.post("/bet-credit", protect, betCredit);

router.get("/transactions", protect, getTransactions);
router.get("/summary", protect, getSummary);
// router.post("/deposit", protect, deposit);
// router.post("/withdraw", protect, withdraw);

export default router;
