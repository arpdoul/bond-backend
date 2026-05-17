import { fetchFXRates, shouldSettle, FXRates } from '../services/fx';
import { payForDataService } from '../services/nanopay';
import { pool } from '../services/db';

export interface SettlementRecord {
  id: string;
  timestamp: string;
  action: 'SETTLE' | 'HOLD' | 'NANOPAY';
  rates: FXRates;
  result: string;
  fee?: string;
}

export const settlementHistory: SettlementRecord[] = [];
let agentRunning = false;

export function setAgentRunning(state: boolean) {
  agentRunning = state;
  console.log(`[BOND] Agent is now ${state ? 'RUNNING' : 'STOPPED'}`);
}

export function isAgentRunning() { return agentRunning; }

export async function runAgentCycle() {
  if (!agentRunning) return;
  console.log('[BOND] Running agent cycle...');

  // Pay for FX data via Nanopayments
  const nanopay = await payForDataService('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP');
  console.log(`[BOND] Nanopay: ${nanopay.txId} — paid ${nanopay.amount} USDC for FX data`);

  const rates = await fetchFXRates();
  const settle = shouldSettle(rates);

  const record: SettlementRecord = {
    id: `bond-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: settle ? 'SETTLE' : 'HOLD',
    rates,
    result: '',
  };

  if (settle) {
    const settleAmount = 0.10;
    const feeAmount = settleAmount * 0.001;
    record.result = `Settled ${settleAmount} USDC. Fee: ${feeAmount} USDC`;
    record.fee = feeAmount.toFixed(6);

    try {
      const users = await pool.query('SELECT id FROM users WHERE deposited_usdc > 0');
      for (const user of users.rows) {
        await pool.query(
          `INSERT INTO settlements (user_id, action, amount, fee, eurc_rate, tx_hash)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.id, 'SETTLE', settleAmount, feeAmount, rates.EURC_USD, `sim-${Date.now()}`]
        );
        await pool.query(
          'UPDATE users SET earned_usdc = earned_usdc + $1 WHERE id = $2',
          [feeAmount, user.id]
        );
      }

      // Log nanopay as a settlement record
      await pool.query(
        `INSERT INTO settlements (user_id, action, amount, fee, eurc_rate, tx_hash)
         SELECT id, 'NANOPAY', 0.000001, 0, $1, $2 FROM users WHERE deposited_usdc > 0 LIMIT 1`,
        [rates.EURC_USD, nanopay.txId]
      );

      console.log(`[BOND] Settled for ${users.rows.length} users`);
    } catch (err: any) {
      console.error('[BOND] DB write failed:', err.message);
    }
  } else {
    record.result = 'Rate within threshold. Holding.';
  }

  settlementHistory.unshift(record);
  if (settlementHistory.length > 50) settlementHistory.pop();
  console.log('[BOND]', record.result);
}
