import { Server } from "socket.io";

let io;

export function initSocket(server) {

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {

    console.log("Socket connected:", socket.id);

    /* JOIN AGENT ROOM */
    socket.on("join-agent", (agentId) => {
      socket.join(`agent-${agentId}`);
      console.log(`Agent joined: agent-${agentId}`);
    });

    /* JOIN USER ROOM */
    socket.on("join-user", (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User joined: user-${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });

  });
}

export function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

/* ✅ SEND AGENT NOTIFICATION */
export const sendAgentNotification = (agentId, data) => {
  if (!io) return;
  io.to(`agent-${agentId}`).emit("notification", data);
};

/* ✅ SEND USER NOTIFICATION */
export const sendUserNotification = (userId, data) => {
  if (!io) return;
  io.to(`user-${userId}`).emit("notification", data);
};