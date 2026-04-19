import express from "express";
import { getGames } from "../controllers/game.controller.js";
import { AGENCY_UID, launchGame } from "../service/gameService.js";
import { decrypt, encrypt } from "../utils/aes.js";

const router = express.Router();

router.get("/", getGames); 
// /api/games?category=originals
router.get("/v1", async (req, res) => {
  try {
    const { username, game_uid } = req.query;

    if (!username || !game_uid) {
      return res.status(400).json({
        error: "username and game_uid required",
      });
    }

    const user = { username };

    const url = await launchGame(user, game_uid);

    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Game launch failed" });
  }
});

router.post("/callback", async (req, res) => {
  try {
    const { payload, agency_uid, timestamp } = req.body;

    if (!payload) {
      return res.json({ code: 1, msg: "missing payload" });
    }

    const data = decrypt(payload);

    console.log("Callback data:", data);

    const betAmount = Number(data.bet_amount || 0);
    const winAmount = Number(data.win_amount || 0);

    // 👉 TODO: replace with DB (Prisma)
    let currentBalance = 1000;

    const newBalance = currentBalance - betAmount + winAmount;

    const responsePayload = encrypt({
      credit_amount: newBalance.toString(),
      timestamp: Date.now().toString(),
    });

    res.json({
      code: 0,
      msg: "",
      payload: responsePayload,
    });
  } catch (err) {
    console.error(err);

    res.json({
      code: 1,
      msg: "error",
    });
  }
});

router.get("/test-encrypt", (req, res) => {
  
  const payload = encrypt({
    agency_uid: AGENCY_UID,
    member_account: "player001",
    game_uid: "1",
    timestamp: Date.now().toString(),
    credit_amount: "100",
    currency_code: "USD",
    language: "en",
    platform: 1,
  });

  res.json({ payload });
});

export default router;
