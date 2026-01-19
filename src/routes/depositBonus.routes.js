import express from "express";
import { getActiveDepositBonus } from "../controllers/depositBonus.controller.js";

const router = express.Router();

router.get("/", getActiveDepositBonus);
// GET /api/deposit-bonus

export default router;
