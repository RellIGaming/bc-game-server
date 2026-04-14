import express from "express";
import { getMyTickets, getRaffleData, getRaffleWinners } from "../controllers/raffle.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/raffle-data", protect, getRaffleData);
router.get("/winners", protect, getRaffleWinners);
router.get("/my-tickets", protect, getMyTickets);

export default router;