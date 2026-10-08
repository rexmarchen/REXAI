"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tokenRefreshWorker_1 = require("../src/queue/tokenRefreshWorker");
const pollWorker_1 = require("../src/polling/pollWorker");
const logger_1 = require("../src/lib/logger");
/**
 * Run once after deploy (or in a deploy hook) to register the recurring
 * BullMQ repeatable jobs. Safe to run multiple times — repeat jobs are
 * keyed by jobId and won't duplicate.
 */
async function main() {
    await (0, tokenRefreshWorker_1.scheduleTokenRefreshSweep)();
    await (0, pollWorker_1.schedulePollSweep)();
    logger_1.logger.info("Recurring sweeps registered.");
    process.exit(0);
}
main().catch((err) => {
    logger_1.logger.error({ err }, "Seed script failed");
    process.exit(1);
});
//# sourceMappingURL=seed.js.map