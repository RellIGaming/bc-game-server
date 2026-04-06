import express from "express";
import { requestWithdraw } from "../controllers/withdraw.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/request", protect, requestWithdraw);

export default router;