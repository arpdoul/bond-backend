import cron from 'node-cron';
import { runAgentCycle } from './engine';
import dotenv from 'dotenv';

dotenv.config();

const INTERVAL = process.env.FX_CHECK_INTERVAL || '*/5 * * * *';

export function startScheduler() {
  console.log(`[BOND] Scheduler started. Interval: ${INTERVAL}`);
  cron.schedule(INTERVAL, async () => {
    await runAgentCycle();
  });
}
