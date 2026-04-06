import express from "express";
import { requestDeposit } from "../controllers/deposit.controller.js";
import { getActiveDepositBonus } from "../controllers/depositBonus.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/request", protect, requestDeposit);
router.get("/deposit-bonus", getActiveDepositBonus);
export default router;
