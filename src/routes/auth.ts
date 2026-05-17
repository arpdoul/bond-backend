import { Router } from 'express';
import axios from 'axios';
import { findOrCreateUser, generateToken, verifyToken } from '../services/auth';
import { pool } from '../services/db';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ error: 'Wallet address required' });
    const user = await findOrCreateUser(walletAddress);
    const token = generateToken(user.id, user.wallet_address);
    res.json({ token, user });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = verifyToken(token);
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    res.json(result.rows[0]);
  } catch { res.status(401).json({ error: 'Invalid token' }); }
});

router.post('/deposit', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = verifyToken(token);
    const { amount } = req.body;
    await pool.query('UPDATE users SET deposited_usdc = deposited_usdc + $1 WHERE id = $2', [amount, decoded.userId]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/withdraw', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = verifyToken(token);
    const { amount } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    const user = result.rows[0];
    const total = parseFloat(user.earned_usdc) + parseFloat(user.deposited_usdc);
    if (parseFloat(amount) > total) return res.status(400).json({ error: 'Insufficient balance' });
    let rem = parseFloat(amount);
    let newEarned = parseFloat(user.earned_usdc);
    let newDep = parseFloat(user.deposited_usdc);
    if (rem <= newEarned) { newEarned -= rem; } else { rem -= newEarned; newEarned = 0; newDep -= rem; }
    await pool.query('UPDATE users SET earned_usdc = $1, deposited_usdc = $2 WHERE id = $3', [newEarned, newDep, decoded.userId]);
    res.json({ success: true, message: `Withdrawn ${amount} USDC to ${user.wallet_address}` });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/history', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = verifyToken(token);
    const result = await pool.query('SELECT * FROM settlements WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [decoded.userId]);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/pnl', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = verifyToken(token);
    const result = await pool.query(`
      SELECT DATE_TRUNC('hour', created_at) as hour, SUM(fee) as earned, COUNT(*) as settlements
      FROM settlements WHERE user_id = $1 AND action = 'SETTLE'
      GROUP BY DATE_TRUNC('hour', created_at) ORDER BY hour ASC LIMIT 48
    `, [decoded.userId]);
    res.json(result.rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/create-agent-wallet', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = verifyToken(token);
    const existing = await pool.query('SELECT agent_wallet FROM users WHERE id = $1', [decoded.userId]);
    if (existing.rows[0]?.agent_wallet) return res.json({ agentWallet: existing.rows[0].agent_wallet, existing: true });
    const chars = '0123456789abcdef';
    let simWallet = '0x';
    for (let i = 0; i < 40; i++) simWallet += chars[Math.floor(Math.random() * 16)];
    await pool.query('UPDATE users SET agent_wallet = $1 WHERE id = $2', [simWallet, decoded.userId]);
    res.json({ agentWallet: simWallet, existing: false });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
