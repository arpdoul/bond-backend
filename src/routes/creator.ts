import { Router, Request, Response } from 'express';
import { circleTransfer } from '../services/circleTransfer';

const router = Router();
const unlocked = new Set<string>();

const ARTICLE = `# The Autonomous Agent Economy

The shift from subscriptions to nanopayments is the biggest change in how
value moves online since credit cards.

## Why It Matters
- Agents earn and spend USDC without human approval per transaction
- Sub-cent settlement removes the payment floor entirely
- USDC on Arc settles in under 500ms
- BOND AgentMesh covers RFBs 02, 03, 04 and 06 in one platform

## The Agent Stack
Orchestrator routes tasks and stakes bonds. DataCollector fetches facts.
Summarizer synthesizes. Every hop settles in USDC on Arc Testnet.
The slashing bond means real skin in the game.

## What This Means for Creators
No more forced subscriptions. Pay per article. Pay per AI call.
Pay per second of compute. The lepton is reborn for machines.

*Unlocked via BOND AgentMesh · Arc Testnet · Circle USDC*`;

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
