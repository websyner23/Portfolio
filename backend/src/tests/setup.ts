import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer;

/** Spins up an in-memory MongoDB so tests never touch a real database. */
export const connectTestDb = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

export const closeTestDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongod?.stop();
};

export const clearCollections = async (except: string[] = []) => {
  const collections = mongoose.connection.collections;
  for (const name of Object.keys(collections)) {
    if (!except.includes(name)) {
      await collections[name].deleteMany({});
    }
  }
};
