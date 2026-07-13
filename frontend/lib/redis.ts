/**
 * Redis client for publishing telemetry events to the Docker Redis instance.
 * The triage service (hrip-triage) listens on these streams and runs AI analysis via Qwen.
 */
import Redis from "ioredis";

// When running via Docker Compose internally, REDIS_URL is redis://redis:6379/0 (Docker hostname).
// When running locally (npm run dev on host), Docker Redis is exposed on port 6380.
// We detect the Docker hostname and rewrite to localhost:6380.
const rawRedisUrl = process.env.REDIS_URL || "redis://localhost:6380/0";
const REDIS_URL = rawRedisUrl.includes("://redis:")
  ? rawRedisUrl.replace("://redis:", "://localhost:").replace(":6379", ":6380")
  : rawRedisUrl;

// Parse the URL for ioredis
function createRedisClient(): Redis {
  try {
    const url = new URL(REDIS_URL);
    return new Redis({
      host: url.hostname,
      port: parseInt(url.port || "6379"),
      db: parseInt(url.pathname?.replace("/", "") || "0"),
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
    });
  } catch {
    return new Redis({
      host: "localhost",
      port: 6379,
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
  }
}

// Global singleton for Next.js HMR
const globalForRedis = global as unknown as { redisPublisher: Redis };
export const redisPublisher =
  globalForRedis.redisPublisher || createRedisClient();
if (process.env.NODE_ENV !== "production")
  globalForRedis.redisPublisher = redisPublisher;

// Stream names - must match what the triage service listens on
export const REDIS_STREAMS = {
  USB: "hrip.events.usb",
  FILE_ACCESS: "hrip.events.file_access",
  CLIPBOARD: "hrip.events.clipboard",
  LOGIN: "hrip.events.login",
  NETWORK: "hrip.events.network",
} as const;

/**
 * Publish an event to a Redis Stream for AI triage processing.
 * The payload is JSON-serialized and sent as the "payload" field.
 */
export async function publishToStream(
  stream: string,
  payload: Record<string, unknown>
): Promise<string | null> {
  try {
    await redisPublisher.connect().catch(() => {}); // no-op if already connected
    const id = await redisPublisher.xadd(
      stream,
      "*",
      "payload",
      JSON.stringify(payload)
    );
    console.log(`[redis] Published to ${stream}: ${id}`);
    return id;
  } catch (err) {
    console.error(`[redis] Failed to publish to ${stream}:`, err);
    return null;
  }
}
