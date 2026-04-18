import prisma from "../prisma.js"
import { BOT_NAME, getAIReply } from "../utils/aibot.js";
import { getIO } from "../utils/socket.js";

// GET /api/user/notifications
// POST /api/user/notifications/read
// USER NOTIFICATIONS

export const getUserNotifications = async (req, res) => {

  try {

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    res.json(notifications);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }

};


export const markUserNotificationRead = async (req, res) => {

  try {

    const { id } = req.body;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    res.json({ message: "Notification marked as read" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }

};



export const markAllUserNotificationsRead = async (req, res) => {

  try {

    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false
      },
      data: {
        read: true
      }
    });

    res.json({ message: "All notifications marked as read" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }

};

// get chat message


export const getChatMessages = async (req, res) => {
  try {
    let { room = "global", cursor, limit = 50 } = req.query;

    // ✅ Normalize room name
    room = room.toLowerCase();

    // ✅ Limit safety
    limit = Math.min(parseInt(limit), 100);

    const messages = await prisma.chatMessage.findMany({
      where: { room },
      orderBy: { createdAt: "desc" },
      take: limit,

      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),

      include: {
        replyTo: {
          select: {
            id: true,
            username: true,
            message: true,
          },
        },
      },
    });

    // ✅ Reverse for UI (old → new)
    const formattedMessages = messages.reverse();

    res.json({
      messages: formattedMessages,
      nextCursor: messages.length ? messages[messages.length - 1].id : null,
    });

  } catch (err) {
    console.error("Get chat messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendChatMessage = async (req, res) => {
  try {
    const { message, room = "global", replyToId } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const user = req.user;

    const newMessage = await prisma.chatMessage.create({
      data: {
        userId: user.id,
        username: user.username,
        message: message.trim(),
        room: room.toLowerCase(),
        replyToId: replyToId || null,
        isAdmin: user.role === "admin",
      },
      include: {
        replyTo: {
          select: {
            id: true,
            username: true,
            message: true,
          },
        },
      },
    });

    const io = getIO();

    // ✅ SEND USER MESSAGE
    io.to(newMessage.room).emit("receive-message", newMessage);

    // 🤖 BOT TYPING START
    io.to(newMessage.room).emit("bot-typing", true);

    // 🤖 AI REPLY DELAY
    setTimeout(async () => {
      const botReplyText = await getAIReply(message);

      const botMessage = await prisma.chatMessage.create({
        data: {
          userId: null, // ✅ important
         username: BOT_NAME,
          message: botReplyText,
          room: room.toLowerCase(),
          isAdmin: false,
        },
      });

      // ❌ STOP typing
      io.to(room.toLowerCase()).emit("bot-typing", false);

      // ✅ SEND BOT MESSAGE
      // io.to(room.toLowerCase()).emit("receive-message", botMessage);
    }, 1200);

    res.status(201).json(newMessage);

  } catch (err) {
    console.error("REST chat error:", err);
    res.status(500).json({ message: "Server error" });
  }
};