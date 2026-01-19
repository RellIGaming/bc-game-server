import User from "../models/User.model.js";
import Otp from "../models/Otp.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "crypto";
import { sendMail } from "../config/mail.js";
import BlacklistToken from "../models/BlacklistToken.js";
import { generateToken } from "../utils/generateToken.js";

/* ================= SIGN UP ================= */
export const signup = async (req, res) => {
  const { username, email, password, promoCode } = req.body;

  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) return res.status(400).json({ message: "User already exists" });

  let referredBy = null;
  if (promoCode) {
    const ref = await User.findOne({ username: promoCode });
    if (ref) referredBy = ref._id;
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hashed,
    referredBy,
  });

  res.status(201).json({
    token: generateToken(user._id),
    user,
  });
};

/* ================= SIGN IN (PASSWORD) ================= */
export const signin = async (req, res) => {
  const { identifier, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });

  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  res.json({
    token: generateToken(user._id),
    user,
  });
};

/* ================= SEND OTP ================= */
export const sendOtp = async (req, res) => {
  const { identifier } = req.body; // email or phone

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.deleteMany({ identifier });

  await Otp.create({
    identifier,
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  if (identifier.includes("@")) {
    await sendMail(identifier, "OTP Login", `Your OTP is ${otp}`);
  } else {
    console.log("📱 SMS OTP:", otp);
  }

  res.json({ message: "OTP sent successfully" });
};

/* ================= OTP LOGIN ================= */
export const otpLogin = async (req, res) => {
  const { identifier, otp } = req.body;

  const record = await Otp.findOne({ identifier, otp });
  if (!record || record.expiresAt < Date.now())
    return res.status(400).json({ message: "Invalid or expired OTP" });

  let user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
  });

  if (!user) {
    user = await User.create({
      email: identifier.includes("@") ? identifier : undefined,
      phone: identifier.includes("@") ? undefined : identifier,
      username: `user_${Date.now()}`,
    });
  }

  await Otp.deleteMany({ identifier });

  res.json({
    token: generateToken(user._id),
    user,
  });
};

/* ================= FORGOT PASSWORD ================= */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const resetToken = randomBytes(32).toString("hex");

  user.resetPasswordToken = createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  await user.save();

  await sendMail(email, "Reset Password", `Token: ${resetToken}`);

  res.json({ message: "Reset link sent" });
};

/* ================= RESET PASSWORD ================= */
export const resetPassword = async (req, res) => {
  const hashed = createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid or expired token" });

  user.password = await bcrypt.hash(req.body.password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  res.json({ message: "Password reset successful" });
};

/* ================= PROFILE ================= */
export const getProfile = async (req, res) => {
  res.json(req.user);
};

export const updateProfile = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
  }).select("-password");
  res.json(user);
};

/* ================= LOGOUT ================= */
export const logout = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  await BlacklistToken.create({ token });
  res.json({ message: "Logged out successfully" });
};
