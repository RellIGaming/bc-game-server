// config/mail.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.verify((err) => {
  if (err) {
    console.error("Mail config error:", err);
  } else {
    console.log("Mail server ready ✅");
  }
});
/* ================= SEND MAIL ================= */
export const sendMail = async (to, subject, text, html) => {
  try {
    await transporter.sendMail({
      from: `"Game App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html, // ✅ now valid
    });
  } catch (error) {
    console.error("Mail Error:", error.message);
    throw new Error("Email sending failed");
  }
};