// controllers/otp.controller.js

import pool from "../config/db.js";
import { sendMail } from "../config/mail.js";

export const sendOtp = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: "Identifier required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 🔹 Use transaction for safety
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Delete old OTPs for this identifier
      await client.query(
        `DELETE FROM otps WHERE identifier = $1`,
        [identifier]
      );

      // Insert new OTP
      await client.query(
        `INSERT INTO otps (identifier, otp, expires_at)
         VALUES ($1, $2, $3)`,
        [identifier, otp, expiresAt]
      );

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    // Send email if identifier is email
    if (identifier.includes("@")) {
      await sendMail(identifier, "Your OTP", `Your OTP is ${otp}`);
    }

    console.log("OTP:", otp);

    res.json({ message: "OTP sent" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};