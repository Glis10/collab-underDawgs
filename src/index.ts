import "dotenv/config";
import express from "express";

import { Request, Response } from "express";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

import { envConfig } from "@/config/env.config";
import { v1Router } from "@/routes";
import { corsOptions } from "@/config";
import { initializeSocketIo } from "./socket";
import ApiResponse from "@/utils/api/ApiResponse";

const app = express();
const port = envConfig.port;

// middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// V1 API routes
app.use("/api/v1", v1Router);

// 404 handler for undefined routes
app.use((req: Request, res: Response) => {
  res
    .status(404)
    .json(
      new ApiResponse(404, `${req.method} route not found for ${req.url}`, null)
    );
});

function startServer() {
  try {
    const httpServer = createServer(app);
    const io = new Server(httpServer, { cors: corsOptions });
    app.set("io", io);

    // Socket.io event handlers
    initializeSocketIo(io);

    // Start server on specified port
    httpServer.listen(port, () => {
      console.log(`Server is listening on: ${port}`);
    });
  } catch (error) {
    console.log("Error starting server", error);
  }
}

// Start server
startServer();
