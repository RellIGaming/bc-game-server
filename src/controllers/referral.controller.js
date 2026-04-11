import prisma from "../prisma.js";


// controllers/referral.controller.js

export const getReferralDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        /* ================= USER ================= */

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                referralCode: true
            }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        /* ================= FRIENDS ================= */

        const totalFriends = await prisma.user.count({
            where: { referredBy: userId }
        });

        /* ================= TOTAL REFERRAL REWARD ================= */

        const referralReward = await prisma.walletTransaction.aggregate({
            _sum: { amount: true },
            where: {
                userId,
                referenceType: "REFERRAL"
            }
        });

        /* ================= COMMISSION (YOU CAN EXTEND LATER) ================= */

        const commissionReward = await prisma.walletTransaction.aggregate({
            _sum: { amount: true },
            where: {
                userId,
                type: "DEPOSIT",
                referenceType: "REFERRAL"
            }
        });

        /* ================= RECENT ACTIVITIES ================= */

        const activities = await prisma.walletTransaction.findMany({
            where: {
                userId,
                referenceType: "REFERRAL"
            },
            orderBy: { createdAt: "desc" },
            take: 10
        });

        /* ================= LIVE REWARDS (GLOBAL) ================= */

        const liveRewardsRaw = await prisma.walletTransaction.findMany({
            where: {
                referenceType: "REFERRAL"
            },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: {
                user: {
                    select: { username: true }
                }
            }
        });

        const liveRewards = liveRewardsRaw.map((r) => ({
            user: r.user?.username || "Unknown",
            amount: `+${r.amount}`,
            icon: "🟢"
        }));

        /* ================= RESPONSE ================= */

        res.json({
            referralCode: user.referralCode,
            referralLink: `https://bc-game-client.onrender.com/i-${user.referralCode}`,

            stats: {
                totalFriends,
                totalReward: Number(referralReward._sum.amount || 0),
                referralReward: Number(referralReward._sum.amount || 0),
                commissionReward: Number(commissionReward._sum.amount || 0),
            },

            activities,
            liveRewards
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ================= FRIENDS ================= */
export const getReferralFriends = async (req, res) => {
    try {
        const userId = req.user.id;

        const friends = await prisma.user.findMany({
            where: {
                referredBy: userId
            },
            select: {
                id: true,
                username: true,
                createdAt: true,
                balance: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.json({
            total: friends.length,
            friends
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
/* ================= EARNINGS ================= */
export const getReferralEarnings = async (req, res) => {
    try {
        const userId = req.user.id;

        // get referred users
        const referredUsers = await prisma.user.findMany({
            where: { referredBy: userId },
            select: { id: true }
        });

        const ids = referredUsers.map(u => u.id);

        if (ids.length === 0) {
            return res.json({
                totalFriends: 0,
                totalCommission: 0,
                totalRewards: 0
            });
        }

        /* ===== Example Logic ===== */

        // Commission from their bets (example 1%)
        const bets = await prisma.bet.aggregate({
            where: {
                userId: { in: ids }
            },
            _sum: {
                amount: true
            }
        });

        const totalBetAmount = Number(bets._sum.amount || 0);

        const commissionRate = 0.01; // 1%
        const totalCommission = totalBetAmount * commissionRate;

        // Direct reward (signup bonus)
        const totalRewards = ids.length * 100; // ₹100 per user

        res.json({
            totalFriends: ids.length,
            totalCommission,
            totalRewards,
            totalEarnings: totalCommission + totalRewards
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/referral/test-reward
export const createTestReferralReward = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, referredUserId } = req.body;

        const tx = await prisma.walletTransaction.create({
            data: {
                userId,
                currency: "INR",
                amount: amount || 100,
                type: "DEPOSIT", // or BET_WIN if needed
                status: "COMPLETED",
                referenceType: "REFERRAL",
                // 🔥 THIS IS THE FIX
                referenceId: String(referredUserId) // friend ID
            }
        });

        res.json({
            message: "Test referral reward added",
            tx
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};