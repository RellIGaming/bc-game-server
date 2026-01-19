// models/Otp.js
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  identifier: String, // email or phone
  otp: String,
  expiresAt: Date,
});

export default mongoose.model("Otp", otpSchema);
