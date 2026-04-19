import axios from "axios";
import { encrypt } from "../utils/aes.js";

export const BASE_URL = "https://jsgame.live";
//export const AGENCY_UID = "8dee1e401b87408cca3ca813c2250cb4";
export const AGENCY_UID = "8a61291b65f8d2acfafe9ed9aca87846";

export async function launchGame(user, game_uid = "1") {
  const timestamp = Date.now().toString();

  const payloadData = {
    agency_uid: AGENCY_UID,
    member_account: user.username,
    game_uid: game_uid,
    timestamp: timestamp,
    credit_amount: "100",
    currency_code: "USD",
    language: "en",
  platform: "1",
    callback_url: "https://bc-game-server.onrender.com/api/game/callback",
  };

  const encryptedPayload = encrypt(payloadData);

  const response = await axios.post(`${BASE_URL}/game/v1`, {
    agency_uid: AGENCY_UID,
    timestamp: timestamp,
    payload: encryptedPayload,
  });

  console.log("FULL RESPONSE:", response.data);

  if (response.data.code !== 0) {
    throw new Error(`Provider error: ${response.data.code} - ${response.data.msg}`);
  }

  return response.data.payload?.game_launch_url;
}