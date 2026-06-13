import { Router, Request, Response } from 'express';
import { circleTransfer } from '../services/circleTransfer';

const router = Router();
const sessions = new Map<string, any>();

router.post('/start', (req: Request, res: Response) => {
  const { userWallet, service } = req.body as { userWallet: string; service: string };
  const sessionId = 'stream_' + Date.now() + '_' + (userWallet || 'anon').slice(2, 8);
  sessions.set(sessionId, {
    id: sessionId, userWallet,
    service: service || 'AI Compute',
    startTime: Date.now(), active: true, ratePerSec: 0.001
  });
  res.json({ sessionId, startTime: Date.now(), ratePerSec: 0.001, service: service || 'AI Compute' });
});

router.get('/status/:sessionId', (req: Request, res: Response) => {
  const sid = String(req.params['sessionId']);
  const s = sessions.get(sid);
  if (!s) return res.status(404).json({ error: 'Not found' });
  const elapsed = Math.floor((Date.now() - s.startTime) / 1000);
  const accumulated = (elapsed * s.ratePerSec).toFixed(6);
  res.json({ sessionId: s.id, elapsed, accumulated, currency: 'USDC', active: s.active, service: s.service });
});

router.post('/stop', async (req: Request, res: Response) => {
  const { sessionId } = req.body as { sessionId: string };
  const s = sessions.get(sessionId);
  if (!s) return res.status(404).json({ error: 'Session not found' });
  s.active = false;
  const elapsed = Math.floor((Date.now() - s.startTime) / 1000);
  const totalOwed = (elapsed * s.ratePerSec).toFixed(6);
  try {
    const toAddr = String(process.env.CREATOR_WALLET || '0x72478d18b613f5240ee0454af1ac8ae3c94ad7a6');
    const txId = await circleTransfer(toAddr, totalOwed);
    sessions.delete(sessionId);
    res.json({ elapsed, totalOwed, currency: 'USDC', txId, rate: '$0.001/sec', service: s.service });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
