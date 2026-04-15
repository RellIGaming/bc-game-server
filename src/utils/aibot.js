import axios from "axios";

//aibot.js

export const BOT_NAME = "ChatBot";

export const getAIReply = async (message) => {
  try {
    const res = await axios.post(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
      {
        inputs: `User: ${message}\nBot:`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
        },
      }
    );

    let reply =
      res.data?.generated_text ||
      res.data?.[0]?.generated_text ||
      "";

    reply = reply.replace(`User: ${message}\nBot:`, "").trim();

    return reply || "🤖 I don't understand";
  } catch (err) {
    console.error("HF ERROR:", err.response?.data || err.message);
    return "⚠️ AI busy";
  }
};