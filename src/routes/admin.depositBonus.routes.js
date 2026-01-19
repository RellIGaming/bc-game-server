import express from "express";
import {
  createDepositBonus,
  getAllDepositBonus,
  updateDepositBonus,
  deleteDepositBonus,
} from "../controllers/depositBonus.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

router.use(protect, isAdmin);

router.post("/", createDepositBonus);
router.get("/", getAllDepositBonus);
router.put("/:id", updateDepositBonus);
router.delete("/:id", deleteDepositBonus);

export default router;
