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
  signinByRole
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);

router.post("/send-otp", sendOtp);
router.post("/otp-login", otpLogin);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/profile", protect, getProfile);
router.put("/update-profile", protect, upload.single("profileImage"), updateProfile);
router.post("/logout", protect, logout);
/* USER LOGIN */
router.post("/user/signin", signinByRole("user"));

/* AGENT LOGIN */
router.post("/agent/signin", signinByRole("agent"));

/* ADMIN LOGIN */
router.post("/admin/signin", signinByRole("admin"));


export default router;
