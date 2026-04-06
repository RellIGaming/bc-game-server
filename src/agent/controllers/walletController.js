import prisma from "../../prisma.js";
import { sendUserNotification } from "../../utils/socket.js";

export const getAgentWallet = async (req, res) => {
    try {
        const wallets = await prisma.wallet.findMany({
            where: { userId: req.user.id }
        });

        res.json(wallets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getDepositQueue = async (req, res) => {
    try {

        const deposits = await prisma.deposit.findMany({
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

export const approveDeposit = async (req, res) => {
    // console.log("USER:", req.user)
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
        await prisma.$transaction(async (tx) => {
            const agentWallet = await tx.wallet.findUnique({
                where: {
                    userId_currency: {
                        userId: req.user.id, // agent id
                        currency: deposit.currency
                    }
                }
            });

            if (!agentWallet) {
                throw new Error("Agent wallet not found");
            }

            if (Number(agentWallet.balance) < Number(deposit.amount)) {
                throw new Error("Insufficient agent balance");
            }
            await tx.wallet.update({
                where: {
                    userId_currency: {
                        userId: req.user.id,
                        currency: deposit.currency
                    }
                },
                data: {
                    balance: {
                        decrement: deposit.amount
                    }
                }
            });
            await tx.wallet.upsert({
                where: {
                    userId_currency: {
                        userId: deposit.userId,
                        currency: deposit.currency
                    }
                },
                update: {
                    balance: { increment: deposit.amount }
                },
                create: {
                    userId: deposit.userId,
                    currency: deposit.currency,
                    balance: deposit.amount
                }
            });

            await tx.walletTransaction.create({
                data: {
                    userId: deposit.userId,
                    currency: deposit.currency,
                    amount: deposit.amount,
                    type: "DEPOSIT",
                    status: "COMPLETED",
                    referenceId: deposit.id.toString(),
                    referenceType: "DEPOSIT"
                }
            });

            await tx.deposit.update({
                where: { id: depositId },
                data: {
                    status: "APPROVED",
                    agentId: req.user.id
                }
            });

            await tx.notification.create({
                data: {
                    userId: deposit.userId,
                    type: "deposit-approved",
                    message: `Deposit approved ৳${deposit.amount}`
                }
            });

        });

        sendUserNotification(deposit.userId, {
            type: "deposit-approved",
            amount: deposit.amount,
            currency: deposit.currency,
            message: `Your deposit of ৳${deposit.amount} has been approved`
        });

        res.json({ message: "Deposit approved" });

    } catch (err) {
        console.error("APPROVE ERROR:", err);
        res.status(500).json({ message: err.message });
    }

};


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


export const approveWithdraw = async (req, res) => {

    try {

        const { withdrawId } = req.body;

        const withdraw = await prisma.withdrawal.findUnique({
            where: { id: withdrawId }
        });

        if (!withdraw)
            return res.status(404).json({ message: "Withdraw not found" });

        await prisma.$transaction(async (tx) => {

            const wallet = await tx.wallet.findUnique({
                where: {
                    userId_currency: {
                        userId: withdraw.userId,
                        currency: withdraw.currency
                    }
                }
            });

            if (!wallet || wallet.balance < withdraw.amount)
                throw new Error("Insufficient balance");

            await tx.wallet.update({
                where: {
                    userId_currency: {
                        userId: withdraw.userId,
                        currency: withdraw.currency
                    }
                },
                data: {
                    balance: { decrement: withdraw.amount }
                }
            });

            await tx.walletTransaction.create({
                data: {
                    userId: withdraw.userId,
                    currency: withdraw.currency,
                    amount: withdraw.amount,
                    type: "WITHDRAW",
                    status: "COMPLETED",
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
            currency: withdraw.currency,
            message: `Withdraw request of ৳${withdraw.amount} approved`
        });

        res.json({ message: "Withdraw approved" });

    } catch (err) {
        res.status(400).json({ message: err.message });
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
