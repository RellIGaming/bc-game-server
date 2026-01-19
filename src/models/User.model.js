// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },

  password: String,

  role: {
    type: String,
    enum: ["user", "affiliate", "agent", "admin"],
    default: "user",
  },

  balance: { type: Number, default: 0 },

  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  resetPasswordToken: String,
  resetPasswordExpire: Date,

}, { timestamps: true });

export default mongoose.model("User", userSchema);
