import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      wallet_address VARCHAR(42) UNIQUE NOT NULL,
      agent_wallet VARCHAR(42),
      deposited_usdc DECIMAL DEFAULT 0,
      earned_usdc DECIMAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS settlements (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action VARCHAR(20),
      amount DECIMAL,
      fee DECIMAL,
      eurc_rate DECIMAL,
      tx_hash VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('[BOND] Database initialized');
}
