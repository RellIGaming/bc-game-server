import pool from "../config/db.js";

export const createUser = async (data) => {
  const {
    username,
    email,
    phone,
    password,
    role,
    referredBy,
  } = data;

  const result = await pool.query(
    `INSERT INTO users 
     (username, email, phone, password, role, referred_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [username, email, phone, password, role || "user", referredBy || null]
  );

  return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0];
};

export const findUserById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
};