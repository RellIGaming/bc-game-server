import prisma from "../prisma.js";

export const getTransactions = async (req, res) => {

  const transactions = await prisma.walletTransaction.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  res.json(transactions);
};