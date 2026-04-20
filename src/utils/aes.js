import crypto from "crypto";

const SECRET = "dc279a27da63d49427c4de2e47d9b8c2"; // 32 chars

export function encrypt(data) {
  const key = Buffer.from(SECRET); // ✅ important

  const cipher = crypto.createCipheriv("aes-256-ecb", key, null);

  cipher.setAutoPadding(true);

  let encrypted = cipher.update(JSON.stringify(data), "utf8", "base64");
  encrypted += cipher.final("base64");

  return encrypted;
}