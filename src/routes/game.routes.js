import express from "express";
import { getGames } from "../controllers/game.controller.js";

const router = express.Router();

router.get("/", getGames); 
// /api/games?category=originals

export default router;
