// src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

// export const protect = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     // 1️⃣ Check token existence
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "No token provided" });
//     }

//     const token = authHeader.split(" ")[1];

//     // 2️⃣ Verify JWT
//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       return res.status(401).json({ message: "Invalid token" });
//     }

//     // 3️⃣ Get user from database
//     const result = await pool.query(
//   "SELECT id, username, email, phone, role, balance, profile_image FROM users WHERE id = $1",
//   [decoded.id]
// );

//     if (result.rows.length === 0) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     // 4️⃣ Attach user to request
//     req.user = result.rows[0];

//     next(); // proceed to next middleware or route
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };



export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1️⃣ Check token existence
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // 3️⃣ Get user from database
    const result = await pool.query(
  "SELECT id, username, email, phone, role, balance, profile_image FROM users WHERE id = $1",
  [decoded.id]
);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    // 4️⃣ Attach user to request
    req.user = result.rows[0];

    next(); // proceed to next middleware or route
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

