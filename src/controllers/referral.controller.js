import prisma from "../prisma.js";
import { nanoid } from "nanoid";

// controllers/referral.controller.js

// export const getReferralDashboard = async (req, res) => {
//     try {
//         const userId = req.user.id;

//         /* ================= USER ================= */

//         const user = await prisma.user.findUnique({
//             where: { id: userId },
//             select: {
//                 referralCode: true
//             }
//         });
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }
//         /* ================= FRIENDS ================= */

//         const totalFriends = await prisma.user.count({
//             where: { referredBy: userId }
//         });

//         /* ================= TOTAL REFERRAL REWARD ================= */

//         const referralReward = await prisma.walletTransaction.aggregate({
//             _sum: { amount: true },
//             where: {
//                 userId,
//                 referenceType: "REFERRAL"
//             }
//         });

//         /* ================= COMMISSION (YOU CAN EXTEND LATER) ================= */

//         const commissionReward = await prisma.walletTransaction.aggregate({
//             _sum: { amount: true },
//             where: {
//                 userId,
//                 type: "DEPOSIT",
//                 referenceType: "REFERRAL"
//             }
//         });

//         /* ================= RECENT ACTIVITIES ================= */

//         const activities = await prisma.walletTransaction.findMany({
//             where: {
//                 userId,
//                 referenceType: "REFERRAL"
//             },
//             orderBy: { createdAt: "desc" },
//             take: 10
//         });

//         /* ================= LIVE REWARDS (GLOBAL) ================= */

//         const liveRewardsRaw = await prisma.walletTransaction.findMany({
//             where: {
//                 referenceType: "REFERRAL"
//             },
//             orderBy: { createdAt: "desc" },
//             take: 20,
//             include: {
//                 user: {
//                     select: { username: true }
//                 }
//             }
//         });

//         const liveRewards = liveRewardsRaw.map((r) => ({
//             user: r.user?.username || "Unknown",
//             amount: `+${r.amount}`,
//             icon: "🟢"
//         }));

//         /* ================= RESPONSE ================= */

//         res.json({
//             referralCode: user.referralCode,
//             referralLink: `https://bc-game-client.onrender.com/i/${user.referralCode}`,

//             stats: {
//                 totalFriends,
//                 totalReward: Number(referralReward._sum.amount || 0),
//                 referralReward: Number(referralReward._sum.amount || 0),
//                 commissionReward: Number(commissionReward._sum.amount || 0),
//             },

//             activities,
//             liveRewards
//         });

//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

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

        /* ================= BONUS BALANCE (🔥 IMPORTANT) ================= */

        const wallets = await prisma.wallet.findMany({
            where: { userId },
            select: { bonus: true }
        });

        const totalBonus = wallets.reduce(
            (sum, w) => sum + Number(w.bonus || 0),
            0
        );

        /* ================= REFERRAL REWARD (HISTORY) ================= */

        const referralReward = await prisma.walletTransaction.aggregate({
            _sum: { amount: true },
            where: {
                userId,
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

        /* ================= LIVE REWARDS ================= */

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
            referralLink: `https://bc-game-client.onrender.com/i/${user.referralCode}`,

            stats: {
                totalFriends,

                // 🔥 REAL BONUS (what user can use in UI)
                bonusBalance: totalBonus,

                // 📊 Historical earnings
                referralReward: Number(referralReward._sum.amount || 0),
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
        const { amount = 100, referredUserId } = req.body;

        if (!referredUserId) {
            return res.status(400).json({ message: "referredUserId required" });
        }

        /* ================= DUPLICATE CHECK ================= */

        const exists = await prisma.walletTransaction.findFirst({
            where: {
                referenceId: String(referredUserId), // ✅ FIXED
                type: "REFERRAL_REWARD" // ✅ MATCH TYPE
            }
        });

        if (exists) {
            return res.status(400).json({
                message: "Reward already given"
            });
        }

        /* ================= TRANSACTION (🔥 IMPORTANT) ================= */

        const result = await prisma.$transaction(async (txDb) => {

            // 1️⃣ Create transaction
            const tx = await txDb.walletTransaction.create({
                data: {
                    userId,
                    currency: "BDT",
                    amount,
                    type: "REFERRAL_REWARD", // ✅ FIXED
                    status: "COMPLETED",
                    referenceType: "REFERRAL",
                    referenceId: String(referredUserId)
                }
            });

            // 2️⃣ Update wallet bonus
            await txDb.wallet.update({
                where: {
                    userId_currency: {
                        userId,
                        currency: "BDT"
                    }
                },
                data: {
                    bonus: {
                        increment: amount
                    }
                }
            });

            return tx;
        });

        res.json({
            message: "Referral reward added successfully ✅",
            tx: result
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getCommissionByFriends = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get referred users
        const friends = await prisma.user.findMany({
            where: { referredBy: userId },
            select: {
                id: true,
                username: true,
                createdAt: true
            }
        });

        if (friends.length === 0) {
            return res.json([]);
        }

        const friendIds = friends.map(f => f.id);

        // 2. Get their deposits (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const deposits = await prisma.walletTransaction.groupBy({
            by: ["userId"],
            where: {
                userId: { in: friendIds },
                type: "DEPOSIT",
                createdAt: { gte: sevenDaysAgo }
            },
            _sum: {
                amount: true
            }
        });

        // 3. Get commission earned by you from them
        const commissions = await prisma.walletTransaction.groupBy({
            by: ["referenceId"],
            where: {
                userId,
                referenceType: "REFERRAL"
            },
            _sum: {
                amount: true
            }
        });

        // 4. Merge data
        const result = friends.map(friend => {
            const deposit = deposits.find(d => d.userId === friend.id);
            const commission = commissions.find(
                c => Number(c.referenceId) === friend.id
            );

            return {
                userId: friend.id,
                username: friend.username,
                commissionRate: "25%", // static for now
                totalDeposit7d: Number(deposit?._sum.amount || 0),
                registrationDate: friend.createdAt,
                totalCommission: Number(commission?._sum.amount || 0)
            };
        });

        res.json(result);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getRewardsSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        const referral = await prisma.walletTransaction.aggregate({
            _sum: { amount: true },
            where: {
                userId,
                referenceType: "REFERRAL"
            }
        });

        const commission = await prisma.walletTransaction.aggregate({
            _sum: { amount: true },
            where: {
                userId,
                referenceType: "REFERRAL",
                type: "DEPOSIT"
            }
        });

        res.json({
            availableCommission: Number(commission._sum.amount || 0),
            totalCommission: Number(commission._sum.amount || 0),
            availableReferral: Number(referral._sum.amount || 0),
            totalReferral: Number(referral._sum.amount || 0),
            lockedRewards: 0
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
export const getCommissionByCurrency = async (req, res) => {
    try {
        const userId = req.user.id;

        const data = await prisma.walletTransaction.groupBy({
            by: ["currency"],
            where: {
                userId,
                referenceType: "REFERRAL"
            },
            _sum: {
                amount: true
            }
        });

        res.json(
            data.map(d => ({
                currency: d.currency,
                totalCommission: Number(d._sum.amount || 0)
            }))
        );

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getLevelUpRewards = async (req, res) => {
    try {
        const userId = req.user.id;

        const friends = await prisma.user.findMany({
            where: { referredBy: userId },
            select: {
                id: true,
                username: true,
                createdAt: true,
                referralCode: true
            }
        });

        // fake VIP level for now
        const result = friends.map(f => ({
            username: f.username,
            registrationDate: f.createdAt,
            vipLevel: Math.floor(Math.random() * 10),
            code: f.referralCode,
            earned: 100 // static for now
        }));

        res.json(result);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getRewardHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type } = req.query; // COMMISSION / REFERRAL

        const data = await prisma.walletTransaction.findMany({
            where: {
                userId,
                referenceType: "REFERRAL",

                ...(type === "COMMISSION"
                    ? { type: "DEPOSIT" }
                    : type === "REFERRAL"
                        ? { type: "REFERRAL_REWARD" }
                        : {})
            },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        res.json(data.map(tx => ({
            amount: tx.amount,
            time: tx.createdAt,
            status: tx.status
        })));

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
export const getReferralCodes = async (req, res) => {
    try {
        const userId = req.user.id;

        // ✅ get all codes
        const codes = await prisma.referralCode.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });

        res.json({
            total: codes.length,
            max: 20,
            codes: codes.map(c => ({
                name: c.name || "--",
                code: c.code,
                link: `https://bc-game-client.onrender.com/i/${c.code}`,
                rate: `${c.commissionRate || 25}%`,
                date: c.createdAt,
                referrals: c.referralsCount || 0
            }))
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const createReferralCode = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        const count = await prisma.referralCode.count({
            where: { userId }
        });

        if (count >= 20) {
            return res.status(400).json({
                message: "Max 20 referral codes allowed"
            });
        }

        let code;
        let exists;

        do {
            code = nanoid(8);
            exists = await prisma.referralCode.findUnique({
                where: { code }
            });
        } while (exists);

        const newCode = await prisma.referralCode.create({
            data: {
                userId,
                name,
                code,
                commissionRate: 25
            }
        });

        res.json(newCode);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getCommissionRules = async (req, res) => {
    try {
        res.json({
            baseRate: 1, // 1%
            games: [
                {
                    name: "Original Games",
                    rate: 28
                },
                {
                    name: "3rd Party Slots / Live Casino",
                    rate: 60
                },
                {
                    name: "All Sports",
                    rate: 100
                }
            ]
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const calculateCommission = async (req, res) => {
    try {
        const { wager, gameType } = req.body;

        if (!wager || !gameType) {
            return res.status(400).json({ message: "Missing params" });
        }

        const base = wager * 0.01;

        let rate = 28;

        if (gameType === "slots") rate = 60;
        if (gameType === "sports") rate = 100;

        const result = (base * rate) / 100;

        res.json({
            wager,
            baseCommission: base,
            gameRate: rate,
            result
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getReferralVipLevels = async (req, res) => {
    try {
        const levels = [
            { level: "Bronze I", wager: 1000, unlock: 0.5 },
            { level: "Bronze II", wager: 3000, unlock: 2.5 },
            { level: "Bronze IV", wager: 15000, unlock: 5 },
            { level: "Silver I", wager: 30000, unlock: 12 },
            { level: "Silver III", wager: 120000, unlock: 25 },
            { level: "Silver IV", wager: 240000, unlock: 50 },
            { level: "Gold I", wager: 500000, unlock: 80 },
            { level: "Gold II", wager: 1000000, unlock: 120 },
            { level: "Gold IV", wager: 2500000, unlock: 205 },
            { level: "Platinum II", wager: 8500000, unlock: 500 }
        ];

        res.json({
            currency: "USDT",
            levels
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getReferralProgress = async (req, res) => {
    try {
        const userId = req.user.id;

        const totalWager = await prisma.bet.aggregate({
            _sum: { amount: true },
            where: { userId }
        });

        const wager = Number(totalWager._sum.amount || 0);

        res.json({
            totalWager: wager,
            currentLevel: "Bronze I", // later calculate dynamically
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const processReferralUnlock = async (friendId) => {
    const progressList = await prisma.referralProgress.findMany({
        where: { friendId }
    });

    for (const progress of progressList) {
        const { totalWager, unlocked, userId } = progress;

        let newReward = 0;

        for (const level of VIP_LEVELS) {
            if (totalWager >= level.wager) {
                newReward += level.reward;
            }
        }

        const toUnlock = newReward - unlocked;

        if (toUnlock > 0) {
            await prisma.$transaction(async (tx) => {

                // update unlocked
                await tx.referralProgress.update({
                    where: { id: progress.id },
                    data: { unlocked: newReward }
                });

                // add wallet bonus
                await tx.wallet.update({
                    where: {
                        userId_currency: { userId, currency: "BDT" }
                    },
                    data: {
                        bonus: { increment: toUnlock }
                    }
                });

                // transaction log
                await tx.walletTransaction.create({
                    data: {
                        userId,
                        amount: toUnlock,
                        currency: "BDT",
                        type: "REFERRAL_REWARD",
                        referenceType: "REFERRAL",
                        status: "COMPLETED",
                        referenceId: String(friendId)
                    }
                });
            });
        }
    }
};