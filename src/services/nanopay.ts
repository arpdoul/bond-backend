import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface NanopayResult {
  success: boolean;
  txId?: string;
  amount: string;
  service: string;
  error?: string;
}

// Bond pays for FX data feeds via Nanopayments (x402)
export async function payForDataService(
  serviceUrl: string,
  microAmount: string = '0.000001'
): Promise<NanopayResult> {
  try {
    // circle wallet pay --url <x402-service-url> --testnet
    const { stdout } = await execAsync(
      `circle wallet pay --url ${serviceUrl} --testnet`
    );
    return {
      success: true,
      txId: extractTxId(stdout),
      amount: microAmount,
      service: serviceUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      amount: microAmount,
      service: serviceUrl,
      error: err.message,
    };
  }
}

function extractTxId(output: string): string {
  const match = output.match(/tx[a-zA-Z0-9_-]{10,}/i);
  return match ? match[0] : 'unknown';
}
