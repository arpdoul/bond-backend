import jwt from 'jsonwebtoken';
import { pool } from './db';

const SECRET = process.env.JWT_SECRET!;

export async function findOrCreateUser(walletAddress: string) {
  const addr = walletAddress.toLowerCase();
  const existing = await pool.query(
    'SELECT * FROM users WHERE wallet_address = $1', [addr]
  );
  if (existing.rows.length > 0) return existing.rows[0];
  const result = await pool.query(
    'INSERT INTO users (wallet_address) VALUES ($1) RETURNING *', [addr]
  );
  return result.rows[0];
}

export function generateToken(userId: number, wallet: string) {
  return jwt.sign({ userId, wallet }, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET) as { userId: number; wallet: string };
}
