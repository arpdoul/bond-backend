import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { circleTransfer } from '../services/circleTransfer';

const router = Router();

const DATACOLLECTOR = '0xbbdbfc139dc66a93142735ff675e7504ae7bd199';
const SUMMARIZER    = '0xe45f7b842230ff0ae1cde0ac14b179d65b16eaed';

router.post('/task', async (req: Request, res: Response) => {
  const { task } = req.body;
  const log: any[] = [];
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Bond posted (logged, symbolic on testnet)
    log.push({ step: 'Orchestrator posts bond', amount: '$0.001',
      note: 'Slashed automatically if task fails' });

    // Pay DataCollector $0.001
    const tx2 = await circleTransfer(DATACOLLECTOR, '0.001');
    log.push({ step: 'Orchestrator → DataCollector', amount: '$0.001', txId: tx2 });

    // DataCollector does work
    const dataMsg = await client.messages.create({
      model: 'claude-haiku-20240307', max_tokens: 512,
      messages: [{ role: 'user',
        content: 'You are DataCollector agent. Extract key facts for: ' + task + '. Bullet points only.' }]
    });
    const rawData = (dataMsg.content[0] as any).text;

    // Pay Summarizer $0.001
    const tx3 = await circleTransfer(SUMMARIZER, '0.001');
    log.push({ step: 'Orchestrator → Summarizer', amount: '$0.001', txId: tx3 });

    // Summarizer does work
    const sumMsg = await client.messages.create({
      model: 'claude-haiku-20240307', max_tokens: 512,
      messages: [{ role: 'user',
        content: 'You are Summarizer agent. Raw data: ' + rawData + '\n\nAnswer clearly: ' + task }]
    });
    const answer = (sumMsg.content[0] as any).text;

    log.push({ step: 'Orchestrator profit retained', amount: '$0.001',
      note: 'Routing fee kept by Orchestrator' });

    res.json({ task, answer, rawData, paymentChain: log, totalCost: '$0.003 USDC' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', (_req: Request, res: Response) => {
  res.json({ agents: 3, hops: 2, costPerTask: '$0.003', currency: 'USDC', chain: 'ARC-TESTNET' });
});

export default router;
