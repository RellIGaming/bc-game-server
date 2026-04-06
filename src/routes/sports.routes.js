import express from "express";
import {
  getMatches,
  getMatchById,
  placeSportsBet,
  settleMatch
} from "../controllers/sports.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";


const router = express.Router();

// Public
router.get("/:sport", getMatches);
router.get("/match/:id", getMatchById);

// User
router.post("/bet", protect, placeSportsBet);

// Admin
router.post("/settle", protect, isAdmin, settleMatch);

export default router;