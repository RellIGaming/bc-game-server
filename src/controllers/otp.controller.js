// controllers/otp.controller.js
import Otp from "../models/Otp.js";
import { sendMail } from "../config/mail.js";

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
    await sendMail(identifier, "Your OTP", `Your OTP is ${otp}`);
  }

  // Phone OTP → integrate SMS provider later
  console.log("OTP:", otp);

  res.json({ message: "OTP sent" });
};
