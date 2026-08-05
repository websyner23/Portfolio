/**
 * Optional local development database.
 *
 * Starts a real mongod (binary managed by mongodb-memory-server) on port 27017
 * with data persisted to backend/.mongo-data, so the whole stack runs offline
 * before MongoDB Atlas credentials are in place.
 *
 *   npm run dev:db          (from backend/, or `npm run dev:db` at the root)
 *
 * Once you have an Atlas cluster, put its URL in backend/.env and you no longer
 * need this script.
 */
import fs from "fs";
import path from "path";
import { MongoMemoryServer } from "mongodb-memory-server";

const DB_PATH = path.join(__dirname, "..", ".mongo-data");
const PORT = 27017;

async function main() {
  fs.mkdirSync(DB_PATH, { recursive: true });

  console.log("▸ Starting local MongoDB…");
  console.log("  (first run downloads the mongod binary — this can take a minute)\n");

  const mongod = await MongoMemoryServer.create({
    instance: {
      port: PORT,
      dbPath: DB_PATH,
      storageEngine: "wiredTiger",
    },
  });

  console.log(`✔ MongoDB running at ${mongod.getUri()}`);
  console.log(`  data directory: ${DB_PATH}`);
  console.log("  press Ctrl+C to stop\n");

  const stop = async () => {
    console.log("\n▸ Stopping local MongoDB…");
    await mongod.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => void stop());
  process.on("SIGTERM", () => void stop());
}

main().catch((err) => {
  console.error("✖ Failed to start local MongoDB:", err);
  process.exit(1);
});
