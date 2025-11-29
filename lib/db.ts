import mongoose from 'mongoose';
import { config } from './config';

const MONGODB_URI = config.mongodb.uri;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  // If already connected, return immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If connection is in progress, wait for it
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (e) {
      cached.promise = null;
      throw e;
    }
  }

  // Start new connection
  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    socketTimeoutMS: 45000, // 45 seconds socket timeout
  };

  cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
    return mongoose;
  }).catch((error) => {
    cached.promise = null;
    throw error;
  });

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

export default connectDB;

