import prisma from "../prisma.js"

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
        cursor: {
          id: cursor,
        },
      }),

      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            username: true,
            message: true,
          },
        },
      }
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

    // ✅ Validate message
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const user = req.user;

    // ✅ Check reply message exists (optional safety)
    let replyTo = null;
    if (replyToId) {
      replyTo = await prisma.chatMessage.findUnique({
        where: { id: replyToId },
        select: {
          id: true,
          username: true,
          message: true,
        },
      });
    }

    // ✅ Save message
    const newMessage = await prisma.chatMessage.create({
      data: {
        userId: user.id,
        username: user.username,
        message: message.trim(),
        room: room.toLowerCase(),
        replyToId: replyTo ? replyTo.id : null,
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

    // ✅ Emit via socket (REALTIME)
    const io = getIO();
    io.to(newMessage.room).emit("receive-message", newMessage);

    // ✅ Response
    res.status(201).json(newMessage);

  } catch (err) {
    console.error("Send chat message error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
