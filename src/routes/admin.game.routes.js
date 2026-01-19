import express from "express";
import {
  createGame,
  getAllGames,
  getGameById,
  updateGame,
  deleteGame,
} from "../controllers/game.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

router.use(protect, isAdmin);

router.post("/", createGame);
router.get("/", getAllGames);
router.get("/:id", getGameById);
router.put("/:id", updateGame);
router.delete("/:id", deleteGame);

export default router;
