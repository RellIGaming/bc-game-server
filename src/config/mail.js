// config/mail.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* ================= SEND MAIL ================= */
export const sendMail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"Game App" <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error("Mail Error:", error.message);
    throw new Error("Email sending failed");
  }
};