import { scheduleTokenRefreshSweep } from "../src/queue/tokenRefreshWorker";
import { schedulePollSweep } from "../src/polling/pollWorker";
import { logger } from "../src/lib/logger";

/**
 * Run once after deploy (or in a deploy hook) to register the recurring
 * BullMQ repeatable jobs. Safe to run multiple times — repeat jobs are
 * keyed by jobId and won't duplicate.
 */
async function main() {
  await scheduleTokenRefreshSweep();
  await schedulePollSweep();
  logger.info("Recurring sweeps registered.");
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, "Seed script failed");
  process.exit(1);
});
