import { Server } from "socket.io";
import prisma from "../prisma.js"; 

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
       AGENT / USER ROOMS
    ========================== */

    socket.on("join-agent", (agentId) => {
      socket.join(`agent-${agentId}`);
      console.log(`Agent joined: agent-${agentId}`);
    });

    socket.on("join-user", (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User joined: user-${userId}`);
    });

    /* =========================
       CHAT ROOM
    ========================== */

    socket.on("join-room", (room) => {
      socket.join(room);
      console.log(`Joined room: ${room}`);
    });

    /* =========================
       SEND MESSAGE
    ========================== */

    socket.on("send-message", async (data) => {
  try {
    const { userId, username, message, room, replyToId, isAdmin } = data;

    const newMessage = await prisma.chatMessage.create({
      data: {
        userId,
        username,
        message,
        room,
        replyToId: replyToId || null,
        isAdmin: isAdmin || false,
      },
      include: {
        replyTo: true, // include replied message
      },
    });

    io.to(room).emit("receive-message", newMessage);

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
   NOTIFICATIONS
========================= */

export const sendAgentNotification = (agentId, data) => {
  if (!io) return;
  io.to(`agent-${agentId}`).emit("notification", data);
};

export const sendUserNotification = (userId, data) => {
  if (!io) return;
  io.to(`user-${userId}`).emit("notification", data);
};