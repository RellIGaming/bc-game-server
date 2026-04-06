import express from "express";
import {
  getDepositQueue,
  getWithdrawQueue,
  approveDeposit,
  rejectDeposit,
  approveWithdraw,
  rejectWithdraw,
  getAgentHistory,
  getAgentStats,
   getNotifications, 
   markAsRead,
    markAllRead,
    getDailyReport,
    getWeeklyReport,
    getMonthlyReport,
    getCommissionReport,
    createTicket,
    getTickets,
    replyTicket,
    getAgentWallet,
    getWeeklyChart

} from "../controllers/walletController.js";

import { protect } from "../../middleware/auth.middleware.js";
import { isAgent } from "../../middleware/admin.middleware.js";

const router = express.Router();

// get wallet balance from admin
router.get("/wallet", protect, isAgent, getAgentWallet);
// deposit queue
router.get("/get-queue",protect, isAgent, getDepositQueue);

// withdraw queue
router.get("/withdraw-queue",protect, isAgent, getWithdrawQueue);

// approve deposit
router.post("/approve-deposit",protect, isAgent, approveDeposit);

// reject deposit
router.post("/reject-deposit",protect, isAgent, rejectDeposit);

// approve withdraw
router.post("/approve-withdraw",protect, isAgent, approveWithdraw);

// reject withdraw
router.post("/reject-withdraw", protect, isAgent, rejectWithdraw);

// agent history
router.get("/history", protect, isAgent, getAgentHistory);

// dashboard stats
router.get("/stats",protect, isAgent, getAgentStats);
//notification
router.get("/notifications", protect, isAgent, getNotifications);

router.post("/notifications/read", protect, isAgent, markAsRead);

router.post("/notifications/read-all", protect, isAgent, markAllRead);

//reports

router.get("/reports/daily", protect, isAgent, getDailyReport);
router.get("/reports/weekly", protect, isAgent, getWeeklyReport);
router.get("/reports/weekly-chart",protect, isAgent, getWeeklyChart);
router.get("/reports/monthly", protect, isAgent, getMonthlyReport);
router.get("/reports/commission",protect, isAgent, getCommissionReport);
//support
router.post("/support/create-ticket", protect, isAgent, createTicket);
router.get("/support/ticket-list", protect, isAgent, getTickets);
router.post("/support/tickets/reply", protect, isAgent, replyTicket);




export default router;