import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { generateToken } from "../utils/generateToken.js";
import { nanoid } from "nanoid";
import { sendMail } from "../config/mail.js";

/* ================= SIGN UP ================= */
// export const signup = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const { username, email, password, promoCode, role } = req.body;

//     await client.query("BEGIN");

//     const exists = await client.query(
//       `SELECT * FROM users WHERE email = $1 OR username = $2`,
//       [email, username]
//     );

//     if (exists.rows.length > 0) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     let referredBy = null;

//     if (promoCode) {
//       const ref = await client.query(
//         "SELECT id FROM users WHERE username = $1",
//         [promoCode]
//       );

//       if (ref.rows.length > 0) {
//         referredBy = ref.rows[0].id;
//       }
//     }

//     const hashed = await bcrypt.hash(password, 10);
//     const userRole =
//       role === "admin" ? "admin" :
//         role === "agent" ? "agent" :
//           "user";

//     /* ================= CREATE USER ================= */

//     const newUser = await client.query(
//       `INSERT INTO users 
//       (username, email, password, role, referred_by)
//       VALUES ($1, $2, $3, $4, $5)
//       RETURNING *`,
//       [username, email, hashed, userRole, referredBy]
//     );

//     const user = newUser.rows[0];

//     /* ================= CREATE MULTI WALLETS ================= */

//     const currencies = ["INR", "BDT","PKR" ,"USD"];

//     for (const currency of currencies) {
//       await client.query(
//         `INSERT INTO wallets (user_id, currency, balance)
//          VALUES ($1, $2, 0)`,
//         [user.id, currency]
//       );
//     }

//     await client.query("COMMIT");

//     const walletsResult = await client.query(
//       `SELECT currency, balance, bonus FROM wallets WHERE user_id = $1`,
//       [user.id]
//     );

//     const wallets = walletsResult.rows;

//     res.status(201).json({
//       token: generateToken(user.id),
//       user,
//       wallets
//     });

//   } catch (error) {

//     await client.query("ROLLBACK");

//     res.status(500).json({
//       message: error.message
//     });

//   } finally {
//     client.release();
//   }
// };

export const signup = async (req, res) => {
  const client = await pool.connect();

  try {
    const { username, email, password, promoCode, role } = req.body;

    await client.query("BEGIN");

    const exists = await client.query(
      `SELECT * FROM users WHERE email = $1 OR username = $2`,
      [email, username]
    );

    if (exists.rows.length > 0) {
      await client.query("ROLLBACK"); // 🔥 VERY IMPORTANT
      return res.status(400).json({ message: "User already exists" });
    }

    /* ================= REFERRAL LOGIC ================= */

    let referredBy = null;
    let usedReferralCode = null;

    if (promoCode) {

      // 1️⃣ Check campaign referral codes first
      const campaign = await client.query(
        `SELECT "userId", code FROM referral_codes WHERE code = $1`,
        [promoCode]
      );

      if (campaign.rows.length > 0) {
        referredBy = campaign.rows[0].userId;
        usedReferralCode = campaign.rows[0].code;

        // 🔥 increment referrals count
        await client.query(
          `UPDATE referral_codes 
       SET "referralsCount" = "referralsCount" + 1
       WHERE code = $1`,
          [promoCode]
        );

      } else {

        // 2️⃣ fallback to default user referral
        const ref = await client.query(
          `SELECT id, referral_code FROM users WHERE referral_code = $1`,
          [promoCode]
        );

        if (ref.rows.length > 0) {
          referredBy = ref.rows[0].id;
          usedReferralCode = ref.rows[0].referral_code;
        }
      }
    }

    /* ================= HASH PASSWORD ================= */

    const hashed = await bcrypt.hash(password, 10);

    const userRole =
      role === "admin"
        ? "admin"
        : role === "agent"
          ? "agent"
          : "user";

    /* ================= GENERATE REFERRAL CODE ================= */

    const referralCode = nanoid(10); // ✅ NEW

    /* ================= CREATE USER ================= */

    const newUser = await client.query(
      `INSERT INTO users 
(username, email, password, role, referred_by, referral_code, used_referral_code)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *`,
      [
        username,
        email,
        hashed,
        userRole,
        referredBy,
        referralCode,
        usedReferralCode
      ]
    );

    const user = newUser.rows[0];
    if (referredBy) {
      await prisma.referralProgress.create({
        data: {
          userId: referredBy,
          friendId: user.id
        }
      });
    }
    /* ================= CREATE WALLETS ================= */

    const currencies = ["INR", "BDT", "USD", "PKR"];

    for (const currency of currencies) {
      await client.query(
        `INSERT INTO wallets (user_id, currency, balance)
         VALUES ($1, $2, 0)`,
        [user.id, currency]
      );
    }

    await client.query("COMMIT");

    const walletsResult = await client.query(
      `SELECT currency, balance, bonus FROM wallets WHERE user_id = $1`,
      [user.id]
    );

    res.status(201).json({
      token: generateToken(user.id),
      user,
      wallets: walletsResult.rows,
      referralCode: user.referral_code, // ✅ return it
      referralLink: `https://bc-game-client.onrender.com/i-${user.referral_code}` // ✅ ready for frontend
    });

  } catch (error) {
    await client.query("ROLLBACK");

    res.status(500).json({
      message: error.message
    });

  } finally {
    client.release();
  }
};

/* ================= SIGN IN ================= */
export const signin = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log("BODY:", req.body);
    const result = await pool.query(
      `SELECT * FROM users 
       WHERE email = $1 OR username = $1 OR phone = $1`,
      [identifier]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ message: "Invalid credentials" });

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      token: generateToken(user.id),
      user,
      referralCode: user.referral_code,
      referralLink: `https://bc-game-client.onrender.com/i-${user.referral_code}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const signinByRole = (role) => async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const result = await pool.query(
      `SELECT * FROM users 
       WHERE (email = $1 OR username = $1 OR phone = $1)
       AND role = $2`,
      [identifier, role]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ message: `${role} not found` });

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      token: generateToken(user.id),
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= SEND OTP ================= */
export const sendOtp = async (req, res) => {
  try {
    const { identifier } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query("DELETE FROM otps WHERE identifier = $1", [identifier]);

    await pool.query(
      `INSERT INTO otps (identifier, otp, expires_at)
       VALUES ($1, $2, $3)`,
      [identifier, otp, expiresAt]
    );

    console.log("OTP:", otp); // Replace with email/SMS logic

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= OTP LOGIN ================= */
export const otpLogin = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    const record = await pool.query(
      `SELECT * FROM otps 
       WHERE identifier = $1 AND otp = $2`,
      [identifier, otp]
    );

    if (
      record.rows.length === 0 ||
      new Date(record.rows[0].expires_at) < new Date()
    )
      return res.status(400).json({ message: "Invalid or expired OTP" });

    let userResult = await pool.query(
      `SELECT * FROM users 
       WHERE email = $1 OR phone = $1`,
      [identifier]
    );

    let user;

    if (userResult.rows.length === 0) {
      const username = `user_${Date.now()}`;

      const newUser = await pool.query(
        `INSERT INTO users (username, email, phone)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          username,
          identifier.includes("@") ? identifier : null,
          identifier.includes("@") ? null : identifier,
        ]
      );

      user = newUser.rows[0];
    } else {
      user = userResult.rows[0];
    }

    await pool.query("DELETE FROM otps WHERE identifier = $1", [identifier]);

    res.json({
      token: generateToken(user.id),
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= FORGOT PASSWORD ================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const resetToken = randomBytes(32).toString("hex");
    const hashed = createHash("sha256").update(resetToken).digest("hex");
    const expireTime = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      `UPDATE users
       SET reset_password_token = $1,
           reset_password_expire = $2
       WHERE email = $3`,
      [hashed, expireTime, email]
    );

    const resetUrl = `https://bc-game-client.onrender.com/reset-password/${resetToken}`;

    await sendMail(
      email,
      "Reset Your Password",
      `Reset link: ${resetUrl}`,
      `
    <h2>Password Reset</h2>
    <p>Click below to reset your password:</p>
    <a href="${resetUrl}" style="
      display:inline-block;
      padding:10px 15px;
      background:#4CAF50;
      color:#fff;
      text-decoration:none;
      border-radius:5px;
    ">Reset Password</a>
    <p>This link expires in 15 minutes.</p>
  `
    );

    res.json({ message: "Reset link sent 📩" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= RESET PASSWORD ================= */
export const resetPassword = async (req, res) => {
  try {
    const hashed = createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const result = await pool.query(
      `SELECT * FROM users
       WHERE reset_password_token = $1
       AND reset_password_expire > NOW()`,
      [hashed]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ message: "Invalid or expired token" });

    const newPassword = await bcrypt.hash(req.body.password, 10);

    await pool.query(
      `UPDATE users
       SET password = $1,
           reset_password_token = NULL,
           reset_password_expire = NULL
       WHERE id = $2`,
      [newPassword, result.rows[0].id]
    );

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= LOGOUT ================= */
export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    await pool.query(
      `INSERT INTO blacklist_tokens (token)
       VALUES ($1)`,
      [token]
    );

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= PROFILE ================= */
export const getProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    // Include profileImage
    res.json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      balance: req.user.balance,
      profileImage: req.user.profile_image
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, email, phone } = req.body;
    let profileImage;

    // Check if file was uploaded
    if (req.file) {
      profileImage = `/images/${req.file.filename}`;
    }

    const result = await pool.query(
      `UPDATE users
       SET username = COALESCE($1, username),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           profile_image = COALESCE($4, profile_image),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, username, email, phone, role, balance, profile_image`,
      [username, email, phone, profileImage, req.user.id]
    );
    const user = result.rows[0];
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      balance: user.balance,
      profileImage: user.profile_image,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};