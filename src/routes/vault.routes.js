import express from "express";
import {
  vaultDeposit,
  vaultWithdraw
} from "../controllers/vault.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/deposit", protect, vaultDeposit);
router.post("/withdraw", protect, vaultWithdraw);

export default router;