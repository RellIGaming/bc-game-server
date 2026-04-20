import axios from "axios";
import { encrypt } from "../utils/aes.js";

const BASE_URL = "https://igamingapis.live/api/v1";
const TOKEN = "3753715335206ddb72c9825777933645";

export async function launchGame(user) {
  const payload = {
    user_id: user.id,
    balance: 500, // number
    game_uid: "784512",
    token: TOKEN,
    timestamp: Date.now(), // number
    return: "https://bc-game-server.onrender.com/return",
    callback: "https://bc-game-server.onrender.com/api/game/callback",
    currency_code: "BDT",
    language: "en",
  };

  const encryptedPayload = encrypt(payload);

  const url = `${BASE_URL}?payload=${encodeURIComponent(encryptedPayload)}&token=${TOKEN}`;

  console.log("FINAL URL:", url); // 👈 DEBUG

  const response = await axios.get(url);

  console.log("SOFTAPI RESPONSE:", response.data);

  if (response.data.code !== 0) {
    throw new Error(response.data.msg);
  }

  return response.data.data.url;
}