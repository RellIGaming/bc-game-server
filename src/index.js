import dotenv from "dotenv";
dotenv.config();
import http from 'http';
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./utils/socket.js";
import { startNewRound } from "./engine/crash.engine.js";

const server = http.createServer(app);

initSocket(server);

connectDB();


startNewRound();

const PORT = process.env.PORT || 5000;


server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
