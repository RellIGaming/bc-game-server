import * as crashService from "./crash.service.js";

export async function placeBet(req, res) {
  try {
    const { amount, autoCashout } = req.body;
    const userId = req.user.id;

    const bet = await crashService.placeBet(
      userId,
      amount,
      autoCashout
    );

    res.json(bet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function cashOut(req, res) {
  try {
    const userId = req.user.id;
    const result = await crashService.cashOut(userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}