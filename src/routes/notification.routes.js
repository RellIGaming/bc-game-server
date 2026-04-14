




import express from "express";
import {
  getUserNotifications,
  markUserNotificationRead,
  markAllUserNotificationsRead,
  getChatMessages,
  sendChatMessage
} from "../controllers/notificationController.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getUserNotifications);

router.post("/read", protect, markUserNotificationRead);

router.post("/read-all", protect, markAllUserNotificationsRead);

router.get("/chat", protect, getChatMessages);
router.post("/chat/send", protect, sendChatMessage);

export default router;






