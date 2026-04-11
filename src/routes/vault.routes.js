import express from "express";
import {
  vaultDeposit,
  vaultWithdraw,
  getVault,
  getVaultTransactions 
} from "../controllers/vault.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/deposit", protect, vaultDeposit);
router.post("/withdraw", protect, vaultWithdraw);
router.get("/", protect, getVault);
router.get("/transactions", protect, getVaultTransactions);

export default router;