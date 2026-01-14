import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { changeUserRole } from "../controllers/admin.controller.js";

const router = express.Router();

/**
 * ADMIN ONLY
 */
router.post(
  "/change-role",
  protect,
  allowRoles("admin"),
  changeUserRole
);

export default router;
