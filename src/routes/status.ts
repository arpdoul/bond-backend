import { Router } from 'express';
import { getBalance } from '../services/wallet';
import { isAgentRunning, setAgentRunning } from '../agent/engine';

const router = Router();

router.get('/', async (req, res) => {
  const balance = await getBalance().catch(() => 'unavailable');
  res.json({
    agent: isAgentRunning() ? 'running' : 'stopped',
    wallet: process.env.AGENT_WALLET_ADDRESS,
    chain: process.env.CHAIN,
    chainId: process.env.CHAIN_ID || '5042002',
    balance,
    uptime: process.uptime(),
  });
});

router.post('/start', (req, res) => {
  setAgentRunning(true);
  res.json({ status: 'started' });
});

router.post('/stop', (req, res) => {
  setAgentRunning(false);
  res.json({ status: 'stopped' });
});

export default router;
