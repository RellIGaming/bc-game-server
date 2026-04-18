import axios from "axios";
import { encrypt } from "../utils/aes.js";

export const BASE_URL = "https://jsgame.live";
export const AGENCY_UID = "8dee1e401b87408cca3ca813c2250cb4";

export async function launchGame(user, game_uid) {
  const timestamp = Date.now().toString();

  const payloadData = {
    agency_uid: AGENCY_UID,
    member_account: user.username,
    game_uid,
    timestamp,
    credit_amount: "100",
    currency_code: "USD",
    language: "en",
    platform: 1,
    callback_url: "https://yourdomain.com/api/game/callback", // IMPORTANT
  };

  const encryptedPayload = encrypt(payloadData);

  const response = await axios.post(`${BASE_URL}/game/v1`, {
    agency_uid: AGENCY_UID,
    timestamp,
    payload: encryptedPayload,
  });

  if (response.data.code !== 0) {
    throw new Error(`Provider error: ${response.data.code}`);
  }

  return response.data.payload?.game_launch_url;
}