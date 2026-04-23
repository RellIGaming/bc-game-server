import prisma from "../../prisma.js";
import { convertToBDT } from "../../utils/convertCurrency.js";
import { sendUserNotification } from "../../utils/socket.js";
import { nanoid } from "nanoid";


//get wallet balance from admin
export const getAgentWallet = async (req, res) => {
    try {
        const wallets = await prisma.wallet.findMany({
            where: { userId: req.user.id }
        });

        res.json(wallets);
        console.log("agent wallet", wallets)
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getDepositQueue = async (req, res) => {
    try {

        const deposits = await prisma.deposit.findMany({
            where: {
                status: {
                    in: ["PENDING", "SUBMITTED"]
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        res.json(deposits);

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};


export const getWithdrawQueue = async (req, res) => {

    try {

        const withdrawals = await prisma.withdrawal.findMany({
            where: { status: "PENDING" },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        res.json(withdrawals);

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

//approve 




export const rejectDeposit = async (req, res) => {

    try {

        const { depositId } = req.body;

        const deposit = await prisma.deposit.findUnique({
            where: { id: depositId }
        });

        if (!deposit)
            return res.status(404).json({ message: "Deposit not found" });

        if (deposit.status !== "PENDING")
            return res.status(400).json({ message: "Already processed" });

        await prisma.$transaction([
            prisma.deposit.update({
                where: { id: depositId },
                data: {
                    status: "REJECTED",
                    agentId: req.user.id
                }
            }),

            prisma.notification.create({
                data: {
                    userId: deposit.userId,
                    type: "deposit-rejected",
                    message: "Your deposit request was rejected"
                }
            })
        ]);
        sendUserNotification(deposit.userId, {
            type: "deposit-rejected",
            message: "Your deposit request was rejected"
        });

        res.json({ message: "Deposit rejected" });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

//approve

// export const approveWithdraw = async (req, res) => {

//     try {

//         const { withdrawId } = req.body;

//         const withdraw = await prisma.withdrawal.findUnique({
//             where: { id: withdrawId }
//         });

//         if (!withdraw)
//             return res.status(404).json({ message: "Withdraw not found" });
//         const userData = await prisma.user.findUnique({
//             where: { id: withdraw.userId },
//             select: { fraudScore: true, isBlocked: true }
//         });

//         if (userData?.isBlocked) {
//             return res.status(403).json({ message: "User is blocked" });
//         }

//         if (userData?.fraudScore >= 80) {
//             return res.status(403).json({
//                 message: "Withdraw blocked - fraud suspicion"
//             });
//         }
//         await prisma.$transaction(async (tx) => {

//             const wallet = await tx.wallet.findUnique({
//                 where: {
//                     userId_currency: {
//                         userId: withdraw.userId,
//                         // currency: withdraw.currency
//                         currency: "BDT"
//                     }
//                 }
//             });
//             const balanceBefore = Number(wallet.balance);
//             const balanceAfter = balanceBefore - Number(withdraw.amount);
//             if (!wallet || Number(wallet.balance) < Number(withdraw.amount)) {
//                 throw new Error("Insufficient balance");
//             }
//             if (withdraw.status !== "PENDING") {
//                 return res.status(400).json({ message: "Already processed" });
//             }
//             await tx.wallet.update({
//                 where: {
//                     userId_currency: {
//                         userId: withdraw.userId,
//                         // currency: withdraw.currency
//                         currency: "BDT"
//                     }
//                 },
//                 data: {
//                     balance: { decrement: withdraw.amount }
//                 }
//             });

//             await tx.walletTransaction.create({
//                 data: {
//                     userId: withdraw.userId,
//                     // currency: withdraw.currency,
//                     txId: "TXN-" + nanoid(10),
//                     currency: "BDT",
//                     amount: withdraw.amount,
//                     type: "WITHDRAW",
//                     status: "COMPLETED",
//                     balanceBefore,
//                     balanceAfter,
//                     referenceId: withdraw.id.toString(),
//                     referenceType: "WITHDRAW"
//                 }
//             });

//             await tx.withdrawal.update({
//                 where: { id: withdrawId },
//                 data: {
//                     status: "APPROVED",
//                     agentId: req.user.id
//                 }
//             });

//             await tx.notification.create({
//                 data: {
//                     userId: withdraw.userId,
//                     type: "withdraw-approved",
//                     message: `Withdraw approved ৳${withdraw.amount}`
//                 }
//             });

//         });

//         sendUserNotification(withdraw.userId, {
//             type: "withdraw-approved",
//             amount: withdraw.amount,
//             // currency: withdraw.currency,
//             currency: "BDT",
//             message: `Withdraw request of ৳${withdraw.amount} approved`
//         });

//         res.json({ message: "Withdraw approved" });

//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }

// };

export const approveWithdraw = async (req, res) => {
    try {
        const { withdrawId } = req.body;

        const withdraw = await prisma.withdrawal.findUnique({
            where: { id: withdrawId }
        });

        if (!withdraw)
            return res.status(404).json({ message: "Withdraw not found" });

        await prisma.$transaction(async (tx) => {

            /* ================= FRAUD CHECK ================= */

            const userData = await tx.user.findUnique({
                where: { id: withdraw.userId },
                select: { fraudScore: true, isBlocked: true }
            });

            if (userData?.isBlocked) {
                throw new Error("User is blocked");
            }

            if (userData?.fraudScore >= 80) {
                throw new Error("Withdraw blocked - fraud suspicion");
            }

            /* ================= FRAUD UPDATE ================= */

            let fraudScore = 0;

            if (withdraw.amount > 15000) fraudScore += 25;

            const withdrawCount = await tx.withdrawal.count({
                where: {
                    userId: withdraw.userId,
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            });

            if (withdrawCount > 3) fraudScore += 20;

            if ((userData.fraudScore + fraudScore) >= 100) {
                await tx.user.update({
                    where: { id: withdraw.userId },
                    data: { isBlocked: true }
                });

                throw new Error("User blocked due to fraud risk");
            }

            if (fraudScore > 0) {
                await tx.user.update({
                    where: { id: withdraw.userId },
                    data: {
                        fraudScore: { increment: fraudScore }
                    }
                });
            }

            /* ================= WALLET ================= */

            const wallet = await tx.wallet.findUnique({
                where: {
                    userId_currency: {
                        userId: withdraw.userId,
                        currency: "BDT"
                    }
                }
            });

            if (!wallet || Number(wallet.balance) < Number(withdraw.amount)) {
                throw new Error("Insufficient balance");
            }

            const balanceBefore = Number(wallet.balance);
            const balanceAfter = balanceBefore - Number(withdraw.amount);

            await tx.wallet.update({
                where: {
                    userId_currency: {
                        userId: withdraw.userId,
                        currency: "BDT"
                    }
                },
                data: { balance: { decrement: withdraw.amount } }
            });

            await tx.walletTransaction.create({
                data: {
                    userId: withdraw.userId,
                    txId: "TXN-" + nanoid(10),
                    currency: "BDT",
                    amount: withdraw.amount,
                    type: "WITHDRAW",
                    status: "COMPLETED",
                    balanceBefore,
                    balanceAfter,
                    referenceId: withdraw.id.toString(),
                    referenceType: "WITHDRAW"
                }
            });

            await tx.withdrawal.update({
                where: { id: withdrawId },
                data: {
                    status: "APPROVED",
                    agentId: req.user.id
                }
            });
            await tx.notification.create({
                data: {
                    userId: withdraw.userId,
                    type: "withdraw-approved",
                    message: `Withdraw approved ৳${withdraw.amount}`
                }
            });

        });
        sendUserNotification(withdraw.userId, {
            type: "withdraw-approved",
            amount: withdraw.amount,
            // currency: withdraw.currency,
            currency: "BDT",
            message: `Withdraw request of ৳${withdraw.amount} approved`
        });
        res.json({ message: "Withdraw approved" });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const approveDeposit = async (req, res) => {
    try {
        const { depositId } = req.body;

        if (!depositId)
            return res.status(400).json({ message: "Deposit ID required" });

        const deposit = await prisma.deposit.findUnique({
            where: { id: depositId }
        });

        if (!deposit)
            return res.status(404).json({ message: "Deposit not found" });

        if (deposit.status !== "PENDING")
            return res.status(400).json({ message: "Already processed" });

        if (req.user.role !== "agent") {
            return res.status(403).json({ message: "Only agent can approve" });
        }

        const amount = Number(deposit.amountBDT);

        await prisma.$transaction(async (tx) => {

            /* ================= FRAUD CHECK FIRST ================= */

            const userData = await tx.user.findUnique({
                where: { id: deposit.userId },
                select: { fraudScore: true, isBlocked: true }
            });

            if (userData?.isBlocked) {
                throw new Error("User is blocked");
            }

            if (userData?.fraudScore >= 70) {
                throw new Error("High risk user - manual review required");
            }

            /* ================= FRAUD CALCULATION ================= */

            let fraudScore = 0;

            if (amount > 10000) fraudScore += 20;

            const todayCount = await tx.deposit.count({
                where: {
                    userId: deposit.userId,
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            });

            if (todayCount > 5) fraudScore += 15;

            /* 🚨 BLOCK IF TOO RISKY */

            if ((userData.fraudScore + fraudScore) >= 90) {
                await tx.user.update({
                    where: { id: deposit.userId },
                    data: { isBlocked: true }
                });

                throw new Error("User blocked due to fraud risk");
            }

            /* ✅ UPDATE FRAUD SCORE BEFORE MONEY */

            if (fraudScore > 0) {
                await tx.user.update({
                    where: { id: deposit.userId },
                    data: {
                        fraudScore: { increment: fraudScore }
                    }
                });
            }

            /* ================= WALLET LOGIC ================= */

            const agentWallet = await tx.wallet.findUnique({
                where: {
                    userId_currency: {
                        userId: req.user.id,
                        currency: "BDT"
                    }
                }
            });

            if (!agentWallet) throw new Error("Agent wallet not found");

            if (Number(agentWallet.balance) < amount) {
                throw new Error("Insufficient agent balance");
            }

            const userWallet = await tx.wallet.findUnique({
                where: {
                    userId_currency: {
                        userId: deposit.userId,
                        currency: "BDT"
                    }
                }
            });

            const balanceBefore = Number(userWallet?.balance || 0);
            const balanceAfter = balanceBefore + amount;

            /* 💰 TRANSFER */

            await tx.wallet.update({
                where: {
                    userId_currency: {
                        userId: req.user.id,
                        currency: "BDT"
                    }
                },
                data: { balance: { decrement: amount } }
            });

            await tx.wallet.upsert({
                where: {
                    userId_currency: {
                        userId: deposit.userId,
                        currency: "BDT"
                    }
                },
                update: { balance: { increment: amount } },
                create: {
                    userId: deposit.userId,
                    currency: "BDT",
                    balance: amount
                }
            });

            /* ================= TRANSACTION ================= */

            await tx.walletTransaction.create({
                data: {
                    userId: deposit.userId,
                    txId: "TXN-" + nanoid(10),
                    currency: "BDT",
                    amount,
                    type: "DEPOSIT",
                    status: "COMPLETED",
                    balanceBefore,
                    balanceAfter,
                    referenceId: deposit.id.toString(),
                    referenceType: "DEPOSIT"
                }
            });

            /* ================= REFERRAL ================= */

            const user = await tx.user.findUnique({
                where: { id: deposit.userId },
                select: { referredBy: true }
            });

            if (user?.referredBy) {
                const commission = amount * 0.05;

                await tx.wallet.upsert({
                    where: {
                        userId_currency: {
                            userId: user.referredBy,
                            currency: "BDT"
                        }
                    },
                    update: { balance: { increment: commission } },
                    create: {
                        userId: user.referredBy,
                        currency: "BDT",
                        balance: commission
                    }
                });

                await tx.walletTransaction.create({
                    data: {
                        userId: user.referredBy,
                        txId: "REF-" + nanoid(10),
                        currency: "BDT",
                        amount: commission,
                        type: "DEPOSIT",
                        status: "COMPLETED",
                        referenceId: deposit.id.toString(),
                        referenceType: "REFERRAL"
                    }
                });
            }

            /* ================= FINAL ================= */

            await tx.deposit.update({
                where: { id: depositId },
                data: { status: "APPROVED", agentId: req.user.id }
            });

            await tx.notification.create({
                data: {
                    userId: deposit.userId,
                    type: "deposit-approved",
                    message: `Deposit approved ৳${deposit.amount}, ${deposit.orderId}`
                }
            });

        });
        sendUserNotification(deposit.userId, {
            type: "deposit-approved",
            amount: deposit.amount,
            // currency: deposit.currency,
            currency: "BDT",
            message: `Your deposit of ৳${deposit.amount} has been approved`
        });

        res.json({
            message: "Deposit approved",
            currency: "BDT",
            amount: amount,
            userId: deposit.userId,
            txId: deposit.id
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const rejectWithdraw = async (req, res) => {

    try {

        const { withdrawId } = req.body;

        const withdraw = await prisma.withdrawal.findUnique({
            where: { id: withdrawId }
        });

        if (!withdraw)
            return res.status(404).json({ message: "Withdraw not found" });

        if (withdraw.status !== "PENDING")
            return res.status(400).json({ message: "Already processed" });


        await prisma.withdrawal.update({
            where: { id: withdrawId },
            data: {
                status: "REJECTED",
                agentId: req.user.id
            }
        });
        await prisma.notification.create({
            data: {
                userId: withdraw.userId,
                type: "withdraw-rejected",
                message: "Withdraw request rejected"
            }
        });

        sendUserNotification(withdraw.userId, {
            type: "withdraw-rejected",
            message: "Withdraw request rejected"
        });

        res.json({ message: "Withdraw rejected" });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};



/* ------------------------------------------------------- */
/* AGENT HISTORY */
/* ------------------------------------------------------- */

export const getAgentHistory = async (req, res) => {

    try {

        const deposits = await prisma.deposit.findMany({
            where: { agentId: req.user.id },
            include: {
                user: {
                    select: {
                        username: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        const withdrawals = await prisma.withdrawal.findMany({
            where: { agentId: req.user.id },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        res.json({
            deposits,
            withdrawals
        });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};



/* ------------------------------------------------------- */
/* AGENT DASHBOARD STATS */
/* ------------------------------------------------------- */

export const getAgentStats = async (req, res) => {
    console.log("USER:", req.user)
    try {

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pendingDeposits = await prisma.deposit.count({
            where: { status: "PENDING" }
        });

        const pendingWithdraws = await prisma.withdrawal.count({
            where: { status: "PENDING" }
        });

        const todayDeposits = await prisma.deposit.aggregate({
            _sum: { amount: true },
            where: { status: "APPROVED", createdAt: { gte: today } }
        });

        const todayWithdraw = await prisma.withdrawal.aggregate({
            _sum: { amount: true },
            where: { status: "APPROVED", createdAt: { gte: today } }
        });

        const totalUsers = await prisma.user.count();

        const activeUsers = await prisma.user.count({
            where: { isActive: true }
        });

        const newUsersToday = await prisma.user.count({
            where: { createdAt: { gte: today } }
        });

        const totalTransactions = await prisma.walletTransaction.count();

        const completedTransactions = await prisma.walletTransaction.count({
            where: { status: "COMPLETED" }
        });
        const wallets = await prisma.wallet.findMany({
            where: { userId: req.user.id }
        });

        const totalBalance = wallets.reduce(
            (sum, w) => sum + Number(w.balance),
            0
        );
        res.json({
            walletBalance: totalBalance,
            pendingDeposits,
            pendingWithdraws,
            todayDeposit: todayDeposits._sum.amount || 0,
            todayWithdraw: todayWithdraw._sum.amount || 0,
            totalUsers,
            activeUsers,
            newUsersToday,
            totalTransactions,
            completedTransactions
        });

    } catch (err) {
        console.error("STATS ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};
// Notification
export const getNotifications = async (req, res) => {

    try {
        const notifications = await prisma.notification.findMany({
            where: { agentId: req.user.id },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        res.json(notifications);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }

};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.body;

        await prisma.notification.update({
            where: { id },
            data: { read: true }
        });

        res.json({ message: "Marked as read" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const markAllRead = async (req, res) => {

    await prisma.notification.updateMany({
        where: { agentId: req.user.id, read: false },
        data: { read: true }
    });

    res.json({ message: "All notifications read" });

};

// Reports 
export const getDailyReport = async (req, res) => {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deposits = await prisma.deposit.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: "APPROVED", createdAt: { gte: today } }
    });

    const withdraws = await prisma.withdrawal.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: "APPROVED", createdAt: { gte: today } }
    });

    res.json({
        depositAmount: deposits._sum.amount || 0,
        depositCount: deposits._count || 0,
        withdrawAmount: withdraws._sum.amount || 0,
        withdrawCount: withdraws._count || 0
    });
};

export const getWeeklyReport = async (req, res) => {

    const date = new Date();
    date.setDate(date.getDate() - 7);

    const deposits = await prisma.deposit.aggregate({
        _sum: { amount: true },
        where: { status: "APPROVED", createdAt: { gte: date } }
    });

    res.json({
        weeklyDeposit: deposits._sum.amount || 0
    });

};
export const getWeeklyChart = async (req, res) => {
    const days = 7;
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
        const start = new Date();
        start.setDate(start.getDate() - i);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setHours(23, 59, 59, 999);

        const deposit = await prisma.deposit.aggregate({
            _sum: { amount: true },
            where: {
                status: "APPROVED",
                createdAt: { gte: start, lte: end }
            }
        });

        const withdraw = await prisma.withdrawal.aggregate({
            _sum: { amount: true },
            where: {
                status: "APPROVED",
                createdAt: { gte: start, lte: end }
            }
        });

        const depositAmount = deposit._sum.amount || 0;
        const withdrawAmount = withdraw._sum.amount || 0;

        result.push({
            date: start.toLocaleDateString("en-US", { weekday: "short" }),
            deposit: depositAmount,
            withdraw: withdrawAmount,
            profit: depositAmount - withdrawAmount
        });
    }

    res.json(result);
};
export const getMonthlyReport = async (req, res) => {

    const date = new Date();
    date.setMonth(date.getMonth() - 1);

    const deposits = await prisma.deposit.aggregate({
        _sum: { amount: true },
        where: { status: "APPROVED", createdAt: { gte: date } }
    });

    res.json({
        monthlyDeposit: deposits._sum.amount || 0
    });

};

export const getCommissionReport = async (req, res) => {

    const agentId = req.user.id;

    const deposits = await prisma.deposit.aggregate({
        _sum: { amount: true },
        where: { agentId, status: "APPROVED" }
    });

    const commission = (deposits._sum.amount || 0) * 0.02;

    res.json({
        totalDeposit: deposits._sum.amount || 0,
        commission
    });

};

// Tickets
export const createTicket = async (req, res) => {
    try {
        const { subject, message } = req.body;

        const ticket = await prisma.supportTicket.create({
            data: {
                userId: String(req.user.id), // ✅ FIX HERE
                subject,
                message
            }
        });

        res.json(ticket);
    } catch (err) {
        console.error("Create ticket error:", err);
        res.status(500).json({ message: "Failed to create ticket" });
    }
};

export const getTickets = async (req, res) => {
    try {
        const tickets = await prisma.supportTicket.findMany({
            where: {
                userId: String(req.user.id) // ✅ FIX HERE
            },
            orderBy: { createdAt: "desc" }
        });

        res.json(tickets);
    } catch (err) {
        console.error("Get tickets error:", err);
        res.status(500).json({ message: "Failed to fetch tickets" });
    }
};

export const replyTicket = async (req, res) => {
    try {
        const { ticketId, message } = req.body;

        await prisma.supportReply.create({
            data: {
                ticketId: String(ticketId),        // ✅ safe
                senderId: String(req.user.id),     // ✅ safe
                message
            }
        });

        res.json({ message: "Reply sent" });
    } catch (err) {
        console.error("Reply ticket error:", err);
        res.status(500).json({ message: "Failed to reply" });
    }
};

//getAgentDashboard

export const getReferral = async (req, res) => {
    const agentId = req.user.id;

    const users = await prisma.user.count({
        where: { referredBy: agentId }
    });

    const earnings = await prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: {
            userId: agentId,
            referenceType: "REFERRAL"
        }
    });

    res.json({
        totalUsers: users,
        totalEarnings: Number(earnings._sum.amount || 0)
    });
};


/* ================= USERS ================= */

export const getAgentUsers = async (req, res) => {
    try {
        const agentId = req.user.id;

        const users = await prisma.user.findMany({
            where: { referredBy: agentId },
            select: {
                id: true,
                username: true,
                createdAt: true
            }
        });

        res.json(users);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ================= COMMISSION ================= */

export const getAgentCommission = async (req, res) => {
    try {
        const agentId = req.user.id;

        const commissions = await prisma.walletTransaction.findMany({
            where: {
                userId: agentId,
                referenceType: "REFERRAL"
            },
            orderBy: { createdAt: "desc" }
        });

        res.json(commissions);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ================= TRANSACTIONS ================= */

export const getAgentTransactions = async (req, res) => {
    try {
        const agentId = req.user.id;

        const transactions = await prisma.walletTransaction.findMany({
            where: {
                userId: agentId
            },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        res.json(transactions);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// export const approveDeposit = async (req, res) => {

//     try {

//         const { depositId } = req.body;

//         if (!depositId)
//             return res.status(400).json({ message: "Deposit ID required" });

//         const deposit = await prisma.deposit.findUnique({
//             where: { id: depositId }
//         });

//         if (!deposit)
//             return res.status(404).json({ message: "Deposit not found" });

//         if (deposit.status !== "PENDING")
//             return res.status(400).json({ message: "Already processed" });

//         if (req.user.role !== "agent") {
//             return res.status(403).json({ message: "Only agent can approve" });
//         }
//         const amount = Number(deposit.amountBDT);
//         await prisma.$transaction(async (tx) => {

//             const agentWallet = await tx.wallet.findUnique({
//                 where: {
//                     userId_currency: {
//                         userId: req.user.id,
//                         currency: "BDT"
//                     }
//                 }
//             });

//             const userWallet = await tx.wallet.findUnique({
//                 where: {
//                     userId_currency: {
//                         userId: deposit.userId,
//                         currency: "BDT"
//                     }
//                 }
//             });

//             const balanceBefore = Number(userWallet?.balance || 0);
//             const balanceAfter = balanceBefore + amount;

//             if (!agentWallet) {
//                 throw new Error(`Agent wallet not found`);
//             }

//             if (Number(agentWallet.balance) < amount) {
//                 throw new Error("Insufficient agent balance");
//             }

//             /* ================= MAIN BALANCE TRANSFER ================= */

//             await tx.wallet.update({
//                 where: {
//                     userId_currency: {
//                         userId: req.user.id,
//                         currency: "BDT"
//                     }
//                 },
//                 data: {
//                     balance: { decrement: amount }
//                 }
//             });

//             await tx.wallet.upsert({
//                 where: {
//                     userId_currency: {
//                         userId: deposit.userId,
//                         currency: "BDT"
//                     }
//                 },
//                 update: {
//                     balance: { increment: amount }
//                 },
//                 create: {
//                     userId: deposit.userId,
//                     currency: "BDT",
//                     balance: amount
//                 }
//             });

//             /* ================= USER TRANSACTION ================= */

//             await tx.walletTransaction.create({
//                 data: {
//                     userId: deposit.userId,
//                     txId: "TXN-" + nanoid(10),
//                     currency: "BDT",
//                     amount: amount,
//                     type: "DEPOSIT",
//                     status: "COMPLETED",
//                     balanceBefore,
//                     balanceAfter,
//                     referenceId: deposit.id.toString(),
//                     referenceType: "DEPOSIT"
//                 }
//             });

//             /* ===================================================== */
//             /* 🔥🔥🔥 REFERRAL COMMISSION LOGIC START 🔥🔥🔥 */
//             /* ===================================================== */

//             const user = await tx.user.findUnique({
//                 where: { id: deposit.userId },
//                 select: { referredBy: true }
//             });

//             if (user?.referredBy) {

//                 const commission = amount * 0.05; // ✅ 5%

//                 const refWallet = await tx.wallet.findUnique({
//                     where: {
//                         userId_currency: {
//                             userId: user.referredBy,
//                             currency: "BDT"
//                         }
//                     }
//                 });

//                 const refBefore = Number(refWallet?.balance || 0);
//                 const refAfter = refBefore + commission;

//                 /* ✅ Add commission */

//                 await tx.wallet.upsert({
//                     where: {
//                         userId_currency: {
//                             userId: user.referredBy,
//                             currency: "BDT"
//                         }
//                     },
//                     update: {
//                         balance: { increment: commission }
//                     },
//                     create: {
//                         userId: user.referredBy,
//                         currency: "BDT",
//                         balance: commission
//                     }
//                 });

//                 /* ✅ Save transaction */

//                 await tx.walletTransaction.create({
//                     data: {
//                         userId: user.referredBy,
//                         txId: "REF-" + nanoid(10),
//                         currency: "BDT",
//                         amount: commission,
//                         type: "DEPOSIT",
//                         status: "COMPLETED",
//                         balanceBefore: refBefore,
//                         balanceAfter: refAfter,
//                         referenceId: deposit.id.toString(),
//                         referenceType: "REFERRAL"
//                     }
//                 });

//                 /* ✅ Notify referrer */

//                 await tx.notification.create({
//                     data: {
//                         userId: user.referredBy,
//                         type: "referral-earn",
//                         message: `You earned ৳${commission} from referral`
//                     }
//                 });
//             }

//             /* ===================================================== */
//             /* 🔥🔥🔥 REFERRAL COMMISSION LOGIC END 🔥🔥🔥 */
//             /* ===================================================== */
//             let fraudScore = 0;

//             // Rule 1: Large deposit
//             if (amount > 10000) fraudScore += 20;

//             // Rule 2: Too many deposits today
//             const todayCount = await tx.deposit.count({
//                 where: {
//                     userId: deposit.userId,
//                     createdAt: {
//                         gte: new Date(new Date().setHours(0, 0, 0, 0))
//                     }
//                 }
//             });

//             if (todayCount > 5) fraudScore += 15;

//             // Update fraud score
//             if (fraudScore > 0) {
//                 await tx.user.update({
//                     where: { id: deposit.userId },
//                     data: {
//                         fraudScore: { increment: fraudScore }
//                     }
//                 });
//             }
//             await tx.deposit.update({
//                 where: { id: depositId },
//                 data: {
//                     status: "APPROVED",
//                     agentId: req.user.id
//                 }
//             });

//             await tx.notification.create({
//                 data: {
//                     userId: deposit.userId,
//                     type: "deposit-approved",
//                     message: `Deposit approved ৳${deposit.amount}`
//                 }
//             });

//         });
//         sendUserNotification(deposit.userId, {
//             type: "deposit-approved",
//             amount: deposit.amount,
//             // currency: deposit.currency,
//             currency: "BDT",
//             message: `Your deposit of ৳${deposit.amount} has been approved`
//         });

//         res.json({
//             message: "Deposit approved",
//             currency: "BDT",
//             amount: amount,
//             userId: deposit.userId,
//             txId: deposit.id
//         });

//     } catch (err) {
//         console.error("APPROVE ERROR:", err);
//         res.status(500).json({ message: err.message });
//     }

// };