import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

export const connectDB = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ PostgreSQL Connected");
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
  } catch (err) {
    console.error("❌ PostgreSQL Error", err);
    process.exit(1);
  }
};

export default pool;