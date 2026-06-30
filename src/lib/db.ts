import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

// Cached connection reused across hot reloads in development
const cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } =
  (global as typeof global & { _mongooseCache?: typeof cached })._mongooseCache ??
  (() => {
    const c = { conn: null, promise: null };
    (global as typeof global & { _mongooseCache?: typeof cached })._mongooseCache = c;
    return c;
  })();

export default async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
