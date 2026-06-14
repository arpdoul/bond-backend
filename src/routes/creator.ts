import { Router, Request, Response } from 'express';
import { circleTransfer } from '../services/circleTransfer';

const router = Router();
const unlocked = new Set<string>();

const ARTICLE = `# BOND AgentMesh — The Agent Economy Infrastructure

BOND is not just a project. It is the foundation of an autonomous
agent economy where AI services discover, pay, and earn from each other
without human intervention per transaction.

## What BOND Is Building Long-Term

**Agent Routing Layer**
Every AI agent that needs to complete a task routes through BOND.
Orchestrator stakes a bond, pays subagents, earns a routing fee.
This is the TCP/IP layer for the agent economy.

**x402 Payment Standard**
Every API endpoint in BOND charges per call in USDC.
$0.001 per inference. $0.001 per second of compute.
$0.05 per piece of content. No subscriptions. No minimums.

**Creator Economy Rails**
Any creator can lock content behind a USDC paywall.
Readers pay once. Settlement is instant on Arc Testnet.
No Stripe. No bank account. No geography limits.

**Agent Escrow & Dispute Resolution**
Agents post USDC bonds before tasks.
Bonds slash automatically if tasks fail.
No human arbitration needed.

## Why Arc + Circle

Arc Testnet settles USDC in under 500ms.
Circle Developer Wallets remove private key management.
Together they make nanopayments practical for the first time.

## The Vision

BOND becomes the Stripe for the agent economy —
but instead of charging humans monthly,
it charges agents per microsecond of value exchanged.

Built from an Android phone in Nigeria.
Deployed to the world.

*BOND AgentMesh · Arc Testnet · Circle USDC · Chain 5042002*`;

router.post('/pay', async (req: Request, res: Response) => {
  const { wallet, txId } = req.body;
  if (!wallet) return res.status(400).json({ error: 'wallet required' });
  // Accept payment proof (txId from frontend Circle transfer)
  unlocked.add(wallet.toLowerCase());
  res.json({ success: true, wallet, message: 'Content unlocked!' });
});

router.get('/article', (req: Request, res: Response) => {
  const wallet = ((req.query.wallet as string) || '').toLowerCase();
  if (!wallet || !unlocked.has(wallet)) {
    return res.status(402).json({
      error: 'Payment Required', price: '0.05', currency: 'USDC',
      recipient: process.env.CREATOR_WALLET,
      preview: 'The shift from subscriptions to nanopayments is the biggest change...'
    });
  }
  res.json({ content: ARTICLE, unlockedAt: new Date().toISOString(), wallet });
});

router.get('/stats', (_req: Request, res: Response) => {
  res.json({ totalPayers: unlocked.size,
    totalEarned: (unlocked.size * 0.05).toFixed(2),
    currency: 'USDC', article: 'The Autonomous Agent Economy' });
});

export default router;
