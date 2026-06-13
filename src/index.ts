import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import statusRouter from './routes/status';
import ratesRouter from './routes/rates';
import historyRouter from './routes/history';
import authRouter from './routes/auth';
import agentnetRouter from './routes/agentnet';
import streamRouter from './routes/stream';
import creatorRouter from './routes/creator';
import { startScheduler } from './agent/scheduler';
import { setAgentRunning } from './agent/engine';
import { initDB } from './services/db';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Existing routes
app.use('/api/status', statusRouter);
app.use('/api/rates', ratesRouter);
app.use('/api/history', historyRouter);
app.use('/api/auth', authRouter);

// New AgentMesh routes
app.use('/api/agentnet', agentnetRouter);
app.use('/api/stream', streamRouter);
app.use('/api/creator', creatorRouter);

app.get('/health', (req, res) => res.json({ ok: true, app: 'BOND AgentMesh' }));

const PORT = process.env.PORT || 3000;

async function start() {
  try { await initDB(); } catch(e) { console.log("DB skipped:", (e as any).message); }
  app.listen(PORT, () => {
    console.log(`\n🔗 BOND AgentMesh Backend running on port ${PORT}`);
    console.log(`   Arc Testnet Chain ID: 5042002`);
    console.log(`   Routes: /api/agentnet /api/stream /api/creator`);
    startScheduler();
    setAgentRunning(true);
  });
}

start();
