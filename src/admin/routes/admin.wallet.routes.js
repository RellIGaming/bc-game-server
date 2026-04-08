import express from "express";

import {
  getDeposits,
  approveDeposit,
  approveWithdraw,
  adminCredit,
  setAgentWallet,
  setExchangeRate
} from "../controller/walletController.js";
import { protect } from "../../middleware/auth.middleware.js";
import { isAdmin } from "../../middleware/admin.middleware.js";



const router = express.Router();

router.get("/deposits", protect, isAdmin, getDeposits);
router.post("/approve-deposit", protect, isAdmin, approveDeposit);
router.post("/approve-withdraw", protect,isAdmin, approveWithdraw);
router.post("/credit", protect,isAdmin, adminCredit);
router.post("/set-agent-wallet", protect, isAdmin, setAgentWallet);
router.post("/set-rate", protect, isAdmin, setExchangeRate);

export default router;