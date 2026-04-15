import { Server } from "socket.io";
import prisma from "../prisma.js";
import { getAIReply } from "./aibot.js";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    /* =========================
       AGENT ROOMS
    ========================== */
    socket.on("join-agent", (agentId) => {
      if (!agentId) return;

      socket.join(`agent-${agentId}`);
      console.log(`Agent joined: agent-${agentId}`);
    });

    /* =========================
       USER ROOMS
    ========================== */
    socket.on("join-user", (userId) => {
      if (!userId) return;

      socket.join(`user-${userId}`);
      console.log(`User joined: user-${userId}`);
    });

    /* =========================
       CHAT ROOMS
    ========================== */
    socket.on("join-room", (room) => {
      if (!room) return;

      socket.join(room.toLowerCase());
      console.log(`Joined chat room: ${room}`);
    });

    /* =========================
       CHAT MESSAGE
    ========================== */
    socket.on("send-message", async (data) => {
      try {
        const { userId, message, room = "global", replyToId } = data;

        if (!message || !message.trim()) return;

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true, role: true },
        });

        if (!user) return;

        const normalizedRoom = room.toLowerCase();

        const newMessage = await prisma.chatMessage.create({
          data: {
            userId,
            username: user.username,
            message: message.trim(),
            room: normalizedRoom,
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

        // ✅ SEND USER MESSAGE
        io.to(normalizedRoom).emit("receive-message", newMessage);

        // 🤖 BOT TYPING START
        io.to(normalizedRoom).emit("bot-typing", true);

        // 🤖 AI REPLY (delay)
        setTimeout(async () => {
          try {
            const botReplyText = await getAIReply(message);

            const botMessage = await prisma.chatMessage.create({
              data: {
                userId: null, // ✅ correct
                username: "ChatBot", // ✅ define directly
                message: botReplyText,
                room: normalizedRoom,
                isAdmin: false,
              },
            });

            // STOP typing
            io.to(normalizedRoom).emit("bot-typing", false);

            // SEND bot message
            io.to(normalizedRoom).emit("receive-message", botMessage);

          } catch (err) {
            console.error("Bot error:", err);

            io.to(normalizedRoom).emit("bot-typing", false);
          }
        }, 1200);

      } catch (err) {
        console.error("Chat error:", err);
      }
    });

    /* =========================
       DISCONNECT
    ========================== */
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
}

/* =========================
   GET IO INSTANCE
========================= */
export function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

/* =========================
   NOTIFICATIONS (KEEP THIS)
========================= */

export const sendAgentNotification = (agentId, data) => {
  if (!io) return;

  io.to(`agent-${agentId}`).emit("notification", data);
};

export const sendUserNotification = (userId, data) => {
  if (!io) return;

  io.to(`user-${userId}`).emit("notification", data);
};