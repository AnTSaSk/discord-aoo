import { writeFileSync, unlinkSync } from 'fs';
import { getLogger } from '@/config/logger.js';

/**
 * SEC-015: File-based liveness probe for Docker Swarm health checks.
 *
 * Writes a timestamp to /tmp/.bot-healthy on each Discord gateway heartbeat.
 * The Docker health check verifies the file exists and was updated recently,
 * detecting zombie bots that lost their WebSocket connection.
 */

const LIVENESS_FILE = '/tmp/.bot-healthy';
const HEARTBEAT_INTERVAL_MS = 15_000; // 15 seconds

let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

/** Mark the bot as healthy (write timestamp to liveness file). */
export function markHealthy(): void {
  try {
    writeFileSync(LIVENESS_FILE, Date.now().toString(), { mode: 0o644 });
  } catch {
    // /tmp may not be writable in edge cases — don't crash the bot
    getLogger().warn('Failed to write liveness file');
  }
}

/** Mark the bot as unhealthy (remove liveness file). */
export function markUnhealthy(): void {
  try {
    unlinkSync(LIVENESS_FILE);
  } catch {
    // File may already be gone
  }
}

/** Start periodic heartbeat updates while the bot is connected. */
export function startHeartbeat(): void {
  markHealthy();
  heartbeatTimer = setInterval(markHealthy, HEARTBEAT_INTERVAL_MS);
}

/** Stop heartbeat and mark as unhealthy (used during shutdown). */
export function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = undefined;
  }
  markUnhealthy();
}
