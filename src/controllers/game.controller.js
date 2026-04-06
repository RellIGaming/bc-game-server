import pool from "../config/db.js";

/* ================= USER ================= */

// GET games by category (frontend)
export const getGames = async (req, res) => {
  try {
    const { category, page = 1, limit = 8 } = req.query;

    const games = await prisma.game.findMany({
      where: {
        isActive: true,
        ...(category && { category })
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: Number(limit)
    });

    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= ADMIN ================= */

// CREATE
export const createGame = async (req, res) => {
  try {
    const { name, slug, multiplier, players, category, image } = req.body;

    const imageUrl = req.file
      ? `http://localhost:5000/images/${req.file.filename}`
      : image || null;

    if (!imageUrl) {
      return res.status(400).json({ message: "Image is required" });
    }

    const result = await pool.query(
      `INSERT INTO games
       (name, slug, multiplier, players, image, category)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        name,
        slug,
        multiplier || null,
        players || 0,
        imageUrl,
        category || "originals",
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// READ ALL
export const getAllGames = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM games ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// READ ONE
export const getGameById = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM games WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE
export const updateGame = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE games SET
        name = $1,
        slug = $2,
        multiplier = $3,
        players = $4,
        category = $5,
        is_active = $6,
        updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        req.body.name,
        req.body.slug,
        req.body.multiplier,
        req.body.players,
        req.body.category,
        req.body.isActive,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE
export const deleteGame = async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM games WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.json({ message: "Game deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
