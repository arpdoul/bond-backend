import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

router.post('/task', async (req: Request, res: Response) => {
  const { task } = req.body;
  const log: any[] = [];
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    log.push({ step: 'Orchestrator posts bond', amount: '$0.001',
      note: 'Slashed if task fails', txId: 'bond-' + Date.now() });

    // Pay DataCollector (simulated - Circle transfer logged)
    log.push({ step: 'Orchestrator -> DataCollector', amount: '$0.001',
      txId: '0x' + Math.random().toString(16).slice(2,18) });

    const dataMsg = await client.messages.create({
      model: 'claude-haiku-20240307', max_tokens: 512,
      messages: [{ role: 'user',
        content: 'You are DataCollector agent. Extract key facts for: ' + task + '. Return bullet points only.' }]
    });
    const rawData = (dataMsg.content[0] as any).text;

    // Pay Summarizer (simulated)
    log.push({ step: 'Orchestrator -> Summarizer', amount: '$0.001',
      txId: '0x' + Math.random().toString(16).slice(2,18) });

    const sumMsg = await client.messages.create({
      model: 'claude-haiku-20240307', max_tokens: 512,
      messages: [{ role: 'user',
        content: 'You are Summarizer. Data: ' + rawData + '\n\nAnswer clearly: ' + task }]
    });
    const answer = (sumMsg.content[0] as any).text;

    log.push({ step: 'Orchestrator profit retained', amount: '$0.001',
      note: 'Routing fee' });

    res.json({ task, answer, rawData, paymentChain: log, totalCost: '$0.003 USDC' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', (_req: Request, res: Response) => {
  res.json({ agents: 3, hops: 2, costPerTask: '$0.003', currency: 'USDC', chain: 'ARC-TESTNET' });
});

export default router;
