import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export async function getBalance(): Promise<string> {
  try {
    const res = await axios.get(
      `https://api.circle.com/v1/w3s/wallets?address=${process.env.AGENT_WALLET_ADDRESS}&blockchain=ARC-TESTNET`,
      { headers: { Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    const balances = res.data?.data?.wallets?.[0]?.balances;
    return balances?.length > 0 ? `${balances[0].amount} ${balances[0].token.symbol}` : '0 USDC';
  } catch { return 'unavailable'; }
}

export async function sendUSDC(toAddress: string, amount: string): Promise<string> {
  return `simulated-tx-${Date.now()}`;
}

export async function getWalletInfo(): Promise<object> {
  return { address: process.env.AGENT_WALLET_ADDRESS, chain: 'ARC-TESTNET' };
}
