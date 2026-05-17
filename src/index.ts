import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import statusRouter from './routes/status';
import ratesRouter from './routes/rates';
import historyRouter from './routes/history';
import authRouter from './routes/auth';
import { startScheduler } from './agent/scheduler';
import { setAgentRunning } from './agent/engine';
import { initDB } from './services/db';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/status', statusRouter);
app.use('/api/rates', ratesRouter);
app.use('/api/history', historyRouter);
app.use('/api/auth', authRouter);

app.get('/health', (req, res) => res.json({ ok: true, app: 'BOND' }));

const PORT = process.env.PORT || 3000;

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`\n🔗 BOND Agent Backend running on port ${PORT}`);
    console.log(`   Arc Testnet Chain ID: 5042002`);
    startScheduler();
    setAgentRunning(true);
  });
}

start();
