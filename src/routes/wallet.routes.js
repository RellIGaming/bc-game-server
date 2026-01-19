// routes/wallet.routes.js
import express from "express";
import {
  getBalance,
  creditWallet,
  debitWallet,
  getTransactions,
} from "../controllers/wallet.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/balance", protect, getBalance);
router.post("/credit", protect, creditWallet);
router.post("/debit", protect, debitWallet);
router.get("/transactions", protect, getTransactions);

export default router;
