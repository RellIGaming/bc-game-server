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