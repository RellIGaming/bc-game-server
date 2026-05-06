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
    const promotions = await prisma.promotion.findMany({
      select: { categories: true }
    });

    console.log("RAW PROMOS:", promotions);

    // ✅ Default tabs (ALWAYS present)
    const defaultTabs = ["Casino", "Sports", "Rellbet Exclusive"];

    const unique = new Set();

    // 🔹 Extract from DB
    for (const p of promotions) {
      let cats = p.categories;

      if (!cats) continue;

      if (typeof cats === "string") {
        cats = cats.replace(/[{}"]/g, "").split(",");
      }

      if (Array.isArray(cats)) {
        cats.forEach(c => {
          if (c?.trim()) unique.add(c.trim());
        });
      }
    }

    // 🔹 Merge defaults + DB
    const result = [
      "All",
      ...new Set([...defaultTabs, ...Array.from(unique)])
    ];

    console.log("TABS RESULT:", result);

    res.json(result);

  } catch (err) {
    console.error(err);
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
  where: {
    status: "ACTIVE",
    ...(category !== "All" && {
      categories: { has: category }
    })
  },
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