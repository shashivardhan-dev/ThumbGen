// server.ts
import "dotenv/config";
import next from "next";
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

const app = next({
  dev: false,
});
const handle = app.getRequestHandler();

console.log("process.env.NODE_ENV", process.env.NODE_ENV);
// Redis connection with authentication
const redisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true,
};

// Create Redis clients with proper error handling
const pubClient = new Redis(redisOptions);
const subClient = new Redis(redisOptions);
const progressSub = new Redis(redisOptions);

// Better error handling for Redis connections
pubClient.on("error", (err) => {
  console.error("Redis Pub Client error:", err.message);
});

subClient.on("error", (err) => {
  console.error("Redis Sub Client error:", err.message);
});

progressSub.on("error", (err) => {
  console.error("Redis Progress Client error:", err.message);
});

// Add connection success logging
pubClient.on("connect", () => console.log("Redis Pub Client connected"));
subClient.on("connect", () => console.log("Redis Sub Client connected"));
progressSub.on("connect", () => console.log("Redis Progress Client connected"));

let io: Server;

async function setupSocketIO(httpServer: any) {
  try {
    // Test Redis connections before proceeding
    await pubClient.ping();
    await subClient.ping();
    await progressSub.ping();
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
    // You might want to fall back to in-memory adapter or throw
    throw new Error("Redis connection required for Socket.IO scaling");
  }

  // Create Socket.IO server
  io = new Server(httpServer, {
    path: "/socket", // Changed from "/api/socket" to "/socket"
    transports: ["websocket"],
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL
          : ["http://localhost:3000", "http://localhost:3001"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // 🚀 CRITICAL: Redis adapter enables horizontal scaling
  io.adapter(createAdapter(pubClient, subClient));

  // Subscribe to both generate and edit progress channels
  const progressChannels = [
    "thumbnailGenerate:progress",
    "thumbnailEdit:progress",
  ];

  if (!progressSub.listenerCount("message")) {
    // Subscribe to both channels
    await progressSub.subscribe(...progressChannels);

    progressSub.on("message", (channel, message) => {
      if (progressChannels.includes(channel)) {
        try {
          const data = JSON.parse(message);
          console.log(
            `[${channel}] Broadcasting progress for ${data.thumbnailVersionId}: ${data.status} ${data.pct}%`
          );

          // Determine operation type from channel
          const operation =
            channel === "thumbnailGenerate:progress" ? "generate" : "edit";

          // Add operation type to data
          const enrichedData = {
            ...data,
            operation,
          };

          // Emit to specific operation channel and general thumbnail progress
          io.to(data.thumbnailVersionId).emit(
            "thumbnail:progress",
            enrichedData
          );
          io.to(data.thumbnailVersionId).emit(
            `thumbnail${operation}:progress`,
            enrichedData
          );
        } catch (err) {
          console.error("Failed to parse progress message:", err);
        }
      }
    });
  }

  io.on("connection_error", (err) => {
    console.error("❌ Engine connection error:", err.code, err);
  });

  // Handle client connections
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join thumbnail-specific room for progress updates
    socket.on("join-thumbnail", (thumbnailVersionId) => {
      console.log(
        `Client ${socket.id} joining thumbnail room: ${thumbnailVersionId}`
      );
      if (!thumbnailVersionId) return;

      socket.join(thumbnailVersionId);
      console.log(
        `Client ${socket.id} joined thumbnail room: ${thumbnailVersionId}`
      );

      // Send current status if available
      socket.emit("joined", { thumbnailVersionId, room: thumbnailVersionId });
    });

    // Join specific operation rooms
    socket.on("join-thumbnail-generate", (thumbnailVersionId) => {
      console.log(
        `Client ${socket.id} joining thumbnail generate room: ${thumbnailVersionId}`
      );
      if (!thumbnailVersionId) return;

      socket.join(`${thumbnailVersionId}:generate`);
      socket.emit("joined-generate", {
        thumbnailVersionId,
        room: `${thumbnailVersionId}:generate`,
      });
    });

    socket.on("join-thumbnail-edit", (thumbnailVersionId) => {
      console.log(
        `Client ${socket.id} joining thumbnail edit room: ${thumbnailVersionId}`
      );
      if (!thumbnailVersionId) return;

      socket.join(`${thumbnailVersionId}:edit`);
      socket.emit("joined-edit", {
        thumbnailVersionId,
        room: `${thumbnailVersionId}:edit`,
      });
    });

    // Leave thumbnail room
    socket.on("leave-thumbnail", (thumbnailVersionId) => {
      socket.leave(thumbnailVersionId);
      socket.leave(`${thumbnailVersionId}:generate`);
      socket.leave(`${thumbnailVersionId}:edit`);
      console.log(
        `Client ${socket.id} left thumbnail rooms: ${thumbnailVersionId}`
      );
    });

    socket.on("disconnect", (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  console.log("✅ Socket.IO server initialized with Redis adapter");
  return io;
}

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // Setup Socket.IO with Redis
  try {
    await setupSocketIO(httpServer);
  } catch (error) {
    console.error("❌ Failed to setup Socket.IO:", error);
    process.exit(1);
  }

  const PORT = process.env.PORT || 3000;

  const host = parseInt("0.0.0.0", 10);

  httpServer.listen(PORT, host, () => {
    console.log(`🚀 Next.js + Socket.IO running on http://localhost:${PORT}`);
  });
});

// Export Socket.IO instance for use in other parts of your app
export function getSocketIO(): Server {
  return io;
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");

  // Close Redis connections
  await pubClient.quit();
  await subClient.quit();
  await progressSub.quit();

  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");

  // Close Redis connections
  await pubClient.quit();
  await subClient.quit();
  await progressSub.quit();

  process.exit(0);
});
