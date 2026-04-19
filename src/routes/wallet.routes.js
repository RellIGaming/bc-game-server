// routes/wallet.routes.js
import express from "express";
import {
  getBalance,
  betDebit,
  betCredit,
  getTransactions,getSummary,deposit,withdraw,
  requestDeposit,
  requestWithdraw,
  submitDeposit
} from "../controllers/wallet.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/deposit/request", protect, requestDeposit);
router.post("/withdraw/request", protect, requestWithdraw);
router.get("/balance", protect, getBalance);

router.post("/bet-debit", protect, betDebit);

router.post("/bet-credit", protect, betCredit);

router.get("/transactions", protect, getTransactions);
router.get("/summary", protect, getSummary);
router.post("/submit-deposit", protect, submitDeposit);

export default router;
