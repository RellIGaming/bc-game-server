import pool from "../config/db.js";

/* ================= USER ================= */
export const getActiveDepositBonus = async (req, res) => {
  try {
    const bonusResult = await pool.query(`
      SELECT * FROM deposit_bonuses
      WHERE is_active = TRUE
      LIMIT 1
    `);

    if (bonusResult.rows.length === 0) {
      return res.json(null);
    }

    const bonus = bonusResult.rows[0];

    const paymentMethods = await pool.query(
      `SELECT image_url FROM deposit_bonus_payment_methods
       WHERE deposit_bonus_id = $1`,
      [bonus.id]
    );

    const cryptos = await pool.query(
      `SELECT image_url FROM deposit_bonus_cryptos
       WHERE deposit_bonus_id = $1`,
      [bonus.id]
    );

    res.json({
      ...bonus,
      paymentMethods: paymentMethods.rows,
      cryptos: cryptos.rows,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= ADMIN ================= */
export const createDepositBonus = async (req, res) => {
  const client = await pool.connect();

  try {
    const { percentage, paymentMethods = [], cryptos = [], isActive } = req.body;

    await client.query("BEGIN");

    // Optional: deactivate others if this one active
    if (isActive) {
      await client.query(
        `UPDATE deposit_bonuses SET is_active = FALSE`
      );
    }

    const result = await client.query(
      `INSERT INTO deposit_bonuses (percentage, is_active)
       VALUES ($1, $2)
       RETURNING *`,
      [percentage, isActive ?? true]
    );

    const bonus = result.rows[0];

    for (const image of paymentMethods) {
      await client.query(
        `INSERT INTO deposit_bonus_payment_methods
         (deposit_bonus_id, image_url)
         VALUES ($1, $2)`,
        [bonus.id, image]
      );
    }

    for (const image of cryptos) {
      await client.query(
        `INSERT INTO deposit_bonus_cryptos
         (deposit_bonus_id, image_url)
         VALUES ($1, $2)`,
        [bonus.id, image]
      );
    }

    await client.query("COMMIT");

    res.status(201).json(bonus);

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

export const getAllDepositBonus = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM deposit_bonuses
      ORDER BY created_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDepositBonus = async (req, res) => {
  try {
    const { id } = req.params;
    const { percentage, isActive } = req.body;

    const result = await pool.query(
      `UPDATE deposit_bonuses
       SET percentage = COALESCE($1, percentage),
           is_active = COALESCE($2, is_active),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [percentage, isActive, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Bonus not found" });

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDepositBonus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM deposit_bonuses
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Bonus not found" });

    res.json({ message: "Deposit bonus deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
