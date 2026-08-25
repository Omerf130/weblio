import mongoose from "mongoose";
import { assertDatabaseNameInUri, getDatabaseEnv } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached = global._mongooseCache ?? { conn: null, promise: null };

if (!global._mongooseCache) {
  global._mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  const { MONGODB_URI } = getDatabaseEnv();
  assertDatabaseNameInUri(MONGODB_URI);

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .catch((error: unknown) => {
        cached.promise = null;
        const message =
          error instanceof Error ? error.message : "Unknown MongoDB connection error";
        throw new Error(`MongoDB connection failed: ${message}`);
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

export function getDatabaseConnectionState(): number {
  return mongoose.connection.readyState;
}
