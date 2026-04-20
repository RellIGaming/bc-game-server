import express from "express";
import { getGames } from "../controllers/game.controller.js";
import { launchGame } from "../service/gameService.js";
import { encrypt } from "../utils/aes.js";

const router = express.Router();

router.get("/", getGames); 
// /api/games?category=originals
router.get("/play", async (req, res) => {
  try {
    const user = {
      id: "23213",
    };

    const url = await launchGame(user);

    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/callback", async (req, res) => {
  try {
    const data = req.body;

    console.log("CALLBACK:", data);

    const bet = Number(data.bet_amount);
    const win = Number(data.win_amount);

    const newBalance = 1000 - bet + win;

    res.json({
      credit_amount: newBalance,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error(err);

    res.json({
      credit_amount: -1,
      error: "error",
    });
  }
});

router.get("/test-encrypt", (req, res) => {
  const payloadData = {
    user_id: "23213",
    balance: 500,
    game_uid: "784512",
    token: "3753715335206ddb72c9825777933645",
    timestamp: Date.now(),
    return: "https://bc-game-server.onrender.com/return",
    callback: "https://bc-game-server.onrender.com/api/game/callback",
    currency_code: "BDT",
    language: "en",
  };

  const payload = encrypt(payloadData);

  console.log("RAW PAYLOAD:", payloadData);
  console.log("ENCRYPTED:", payload);

  res.json({
    raw: payloadData,
    encrypted: payload,
  });
});

export default router;
