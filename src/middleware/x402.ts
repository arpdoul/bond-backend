import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const AGENT_WALLET = process.env.ORCHESTRATOR_ADDRESS || '';
const INFERENCE_PRICE = BigInt('1000');

const USDC_ABI = [
  'function allowance(address,address) view returns (uint256)'
];

export async function requirePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const userWallet = req.headers['x-wallet-address'] as string;
    const paymentSig = req.headers['x-payment-sig'] as string;

    if (!userWallet || !paymentSig) {
      return res.status(402).json({
        error: 'Payment Required',
        price: '0.001',
        currency: 'USDC',
        recipient: AGENT_WALLET,
        chain: 5042002,
        message: 'Send x-wallet-address and x-payment-sig headers'
      });
    }

    const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC);
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
    const allowance = await usdc.allowance(userWallet, AGENT_WALLET);

    if (allowance < INFERENCE_PRICE) {
      return res.status(402).json({
        error: 'Insufficient allowance',
        required: INFERENCE_PRICE.toString(),
        actual: allowance.toString()
      });
    }

    (req as any).paymentContext = { userWallet, amount: INFERENCE_PRICE };
    next();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
