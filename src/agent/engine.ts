import { fetchFXRates, shouldSettle, FXRates } from '../services/fx';
import { getBalance, sendUSDC } from '../services/wallet';
import { payForDataService } from '../services/nanopay';

export interface SettlementRecord {
  id: string;
  timestamp: string;
  action: 'SETTLE' | 'HOLD' | 'PAY_SERVICE';
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

export function isAgentRunning() {
  return agentRunning;
}

export async function runAgentCycle() {
  if (!agentRunning) return;

  console.log('[BOND] Running agent cycle...');

  // 1. Fetch FX rates (pay for data if x402 service available)
  const rates = await fetchFXRates();
  console.log('[BOND] Rates fetched:', rates);

  // 2. Decide: settle or hold
  const settle = shouldSettle(rates);

  const record: SettlementRecord = {
    id: `bond-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: settle ? 'SETTLE' : 'HOLD',
    rates,
    result: '',
  };

  if (settle) {
    console.log('[BOND] Threshold crossed → executing settlement');
    // Calculate spread fee (10 bps = 0.1%)
    const settleAmount = '0.10'; // example: settle 0.10 USDC per cycle
    const feeAmount = (parseFloat(settleAmount) * 0.001).toFixed(6);

    try {
      // Send settlement (in production: to user-defined recipient)
      // For testnet demo: send to a dummy address
      const demoRecipient = '0x000000000000000000000000000000000000dead';
      const result = await sendUSDC(demoRecipient, settleAmount);
      record.result = `Settled ${settleAmount} USDC. Fee: ${feeAmount} USDC`;
      record.fee = feeAmount;
      record.result += ` | TX: ${result.substring(0, 40)}...`;
    } catch (err: any) {
      record.result = `Settlement failed: ${err.message}`;
    }
  } else {
    record.result = 'Rate within threshold. Holding.';
  }

  settlementHistory.unshift(record);
  if (settlementHistory.length > 50) settlementHistory.pop();

  console.log('[BOND]', record.result);
}
