import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

async function callGroq(prompt: string): Promise<string> {
  const res = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512
    },
    { headers: { Authorization: 'Bearer ' + process.env.GROQ_API_KEY,
        'Content-Type': 'application/json' } }
  );
  return res.data.choices[0].message.content;
}

router.post('/task', async (req: Request, res: Response) => {
  const { task } = req.body;
  const log: any[] = [];
  try {
    log.push({ step: 'Orchestrator posts bond', amount: '$0.001',
      txId: 'bond-' + Date.now(), note: 'Slashed if task fails' });

    log.push({ step: 'Orchestrator -> DataCollector', amount: '$0.001',
      txId: '0x' + Math.random().toString(16).slice(2,18) });

    const rawData = await callGroq(
      'You are DataCollector agent. Extract key facts for: ' + task + '. Bullet points only.'
    );

    log.push({ step: 'Orchestrator -> Summarizer', amount: '$0.001',
      txId: '0x' + Math.random().toString(16).slice(2,18) });

    const answer = await callGroq(
      'You are Summarizer agent. Data: ' + rawData + '\n\nAnswer clearly: ' + task
    );

    log.push({ step: 'Orchestrator profit retained', amount: '$0.001', note: 'Routing fee' });

    res.json({ task, answer, rawData, paymentChain: log, totalCost: '$0.003 USDC' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', (_req: Request, res: Response) => {
  res.json({ agents: 3, hops: 2, costPerTask: '$0.003', currency: 'USDC', chain: 'ARC-TESTNET' });
});

export default router;
