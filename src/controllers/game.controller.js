// controllers/game.controller.js
import Game from "../models/Game.js";

/* ================= USER ================= */

// GET games by category (frontend)
export const getGames = async (req, res) => {
  const { category } = req.query;

  const filter = { isActive: true };
  if (category) filter.category = category;

  const games = await Game.find(filter).limit(8).sort({ createdAt: -1 });
  res.json(games);
};

/* ================= ADMIN ================= */

// CREATE
export const createGame = async (req, res) => {
  const game = await Game.create(req.body);
  res.status(201).json(game);
};

// READ ALL
export const getAllGames = async (req, res) => {
  const games = await Game.find().sort({ createdAt: -1 });
  res.json(games);
};

// READ ONE
export const getGameById = async (req, res) => {
  const game = await Game.findById(req.params.id);
  if (!game) return res.status(404).json({ message: "Game not found" });
  res.json(game);
};

// UPDATE
export const updateGame = async (req, res) => {
  const game = await Game.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(game);
};

// DELETE
export const deleteGame = async (req, res) => {
  await Game.findByIdAndDelete(req.params.id);
  res.json({ message: "Game deleted" });
};
