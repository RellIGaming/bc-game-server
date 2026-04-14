import prisma from "../prisma.js";


export const getDepositTiers = async (req, res) => {
  try {
    const tiers = await prisma.depositBonusTier.findMany({
      orderBy: { order: "asc" }
    });

    res.json({
      currency: "INR",
      tiers: tiers.map(t => ({
        pct: t.percentage,
        label: t.label,
        min: t.minAmount
      }))
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPromotionTabs = async (req, res) => {
  try {
    const categories = await prisma.promotion.findMany({
      select: { categories: true }
    });

    const unique = new Set(["All"]);

    categories.forEach(p => {
      p.categories.forEach(c => unique.add(c));
    });

    res.json(Array.from(unique));

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPromotions = async (req, res) => {
  try {
    const { category = "All", type = "latest" } = req.query;

    let where = {};

    if (category !== "All") {
      where = {
        categories: {
          has: category
        }
      };
    }

    const promotions = await prisma.promotion.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    res.json(promotions);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBonusTerms = async (req, res) => {
  try {
    const tiers = await prisma.depositBonusTier.findMany({
      orderBy: { order: "asc" }
    });

    const points = tiers.map(t =>
      `${t.label}: ${t.percentage}% bonus (Min ₹${t.minAmount})`
    );

    res.json({
      title: "Deposit Bonus Terms",
      points,
      note: "Bonus credited to rakeback. Wager to unlock."
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};