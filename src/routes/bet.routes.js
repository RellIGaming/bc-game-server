import express from "express";
import { getLiveBets,getBetsFeed,placeBet } from "../controllers/bet.controller.js";

const router = express.Router();
router.get("/feed", getBetsFeed);
router.get("/live", getLiveBets);
router.post('/placebet', placeBet)
export default router;