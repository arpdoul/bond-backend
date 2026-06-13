import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const CIRCLE_API = 'https://api.circle.com/v1/w3s';
const ORCHESTRATOR_WALLET_ID = '9a1615d7-701d-5be3-9d24-88791340e23';
const USDC_TOKEN_ID = 'ef87c8c3-3dc8-43c4-9073-d4e56a9ed11f';

function getHeaders() {
  return {
    Authorization: 'Bearer ' + process.env.CIRCLE_API_KEY,
    'Content-Type': 'application/json'
  };
}

export async function circleTransfer(toAddress: string, amountUSDC: string): Promise<string> {
  const idempotencyKey = uuidv4();
  const res = await axios.post(
    CIRCLE_API + '/developer/transactions/transfer',
    {
      idempotencyKey,
      walletId: ORCHESTRATOR_WALLET_ID,
      tokenId: USDC_TOKEN_ID,
      destinationAddress: toAddress,
      amounts: [amountUSDC],
      fee: { type: 'level', config: { feeLevel: 'MEDIUM' } }
    },
    { headers: getHeaders() }
  );
  const txId = res.data?.data?.id || 'pending-' + Date.now();
  return txId;
}

export async function getOrchestratorBalance(): Promise<string> {
  const res = await axios.get(
    CIRCLE_API + '/wallets/' + ORCHESTRATOR_WALLET_ID + '/balances',
    { headers: getHeaders() }
  );
  const balances = res.data?.data?.tokenBalances || [];
  const usdc = balances.find((b: any) => b.token?.symbol === 'USDC');
  return usdc ? usdc.amount : '0';
}
