import { createServer } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./config";
import { startJobs } from "./jobs";
import { initSocket } from "./socket";

const httpServer = createServer(app);

/**
 * The HTTP server starts listening immediately so the API (and the dev
 * workflow) never blocks on database availability. The Mongo connection is
 * established alongside it and retried in the background if it fails.
 */
const connectDatabase = async (attempt = 1): Promise<void> => {
  try {
    await mongoose.connect(config.databaseUrl, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log("✔ MongoDB connected");

    // Jobs need a live database, so they start only once it's reachable.
    startJobs();
  } catch (err) {
    const wait = Math.min(attempt * 5, 30);
    console.error(`✖ MongoDB connection failed: ${(err as Error).message}`);
    console.error(
      `  Check DATABASE_URL in backend/.env — retrying in ${wait}s (attempt ${attempt})`
    );
    setTimeout(() => void connectDatabase(attempt + 1), wait * 1000);
  }
};

const start = () => {
  initSocket(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`✔ WebSyner API listening on http://localhost:${config.port}`);
  });

  void connectDatabase();
};

start();

const shutdown = (signal: string) => {
  console.log(`\n${signal} received — shutting down`);
  httpServer.close(() => {
    void mongoose.connection.close(false).finally(() => process.exit(0));
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});
