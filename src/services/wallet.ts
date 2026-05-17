import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();
const execAsync = promisify(exec);

const CHAIN = process.env.CHAIN || 'ARC_TESTNET';
const AGENT_WALLET = process.env.AGENT_WALLET_ADDRESS!;

export async function getBalance(): Promise<string> {
  const { stdout } = await execAsync(
    `circle wallet balance --address ${AGENT_WALLET} --chain ${CHAIN} --testnet`
  );
  return stdout.trim();
}

export async function sendUSDC(toAddress: string, amount: string): Promise<string> {
  const { stdout } = await execAsync(
    `circle wallet transfer --from ${AGENT_WALLET} --to ${toAddress} --amount ${amount} --chain ${CHAIN} --testnet`
  );
  return stdout.trim();
}

export async function getWalletInfo(): Promise<object> {
  const { stdout } = await execAsync(
    `circle wallet list --type agent --chain ${CHAIN} --testnet`
  );
  return { raw: stdout.trim() };
}
