import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/admin.middleware.js";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  adminWalletUpdate,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(protect, isAdmin);

router.get("/users", getAllUsers);
router.post("/users", createUser);
router.put("/users/:userId", updateUser);
router.delete("/users/:userId", deleteUser);

router.post("/change-role", changeUserRole);
router.post("/wallet", adminWalletUpdate);

export default router;
