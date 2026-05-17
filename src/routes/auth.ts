import { Router } from 'express';
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = verifyToken(token);
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    res.json(result.rows[0]);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/deposit', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = verifyToken(token);
    const { amount } = req.body;
    await pool.query(
      'UPDATE users SET deposited_usdc = deposited_usdc + $1 WHERE id = $2',
      [amount, decoded.userId]
    );
    res.json({ success: true, message: `Deposited ${amount} USDC` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = verifyToken(token);
    const result = await pool.query(
      'SELECT * FROM settlements WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [decoded.userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
