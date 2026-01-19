import express from "express";
import {
  signup,
  signin,
  sendOtp,
  otpLogin,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  logout,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);

router.post("/send-otp", sendOtp);
router.post("/otp-login", otpLogin);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

router.post("/logout", protect, logout);

export default router;
