import express from "express";
import {
  getSidebarMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from "../controllers/sidebar.controller.js";

const router = express.Router();

// Public
router.get("/", getSidebarMenu);

// Admin
router.post("/", createMenuItem);
router.put("/:id", updateMenuItem);
router.delete("/:id", deleteMenuItem);

export default router;