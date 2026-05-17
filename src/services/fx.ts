import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export interface FXRates {
  USDC_USD: number;
  EURC_USD: number;
  GBPC_USD: number;
  best_currency: string;
  best_rate: number;
  timestamp: string;
}

export async function fetchFXRates(): Promise<FXRates> {
  try {
    const res = await axios.get('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP');
    const eur = res.data.rates.EUR;
    const gbp = res.data.rates.GBP;

    const best = eur > gbp ? { currency: 'EURC', rate: eur } : { currency: 'GBPC', rate: gbp };

    return {
      USDC_USD: 1.0,
      EURC_USD: eur,
      GBPC_USD: gbp,
      best_currency: best.currency,
      best_rate: best.rate,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      USDC_USD: 1.0,
      EURC_USD: 0.92,
      GBPC_USD: 0.79,
      best_currency: 'EURC',
      best_rate: 0.92,
      timestamp: new Date().toISOString(),
    };
  }
}

export function shouldSettle(rates: FXRates): boolean {
  const baseline = parseFloat(process.env.FX_BASELINE || '0.92');
  const threshold = parseFloat(process.env.FX_THRESHOLD || '0.001');
  const deviation = Math.abs(rates.EURC_USD - baseline) / baseline;
  return deviation > threshold;
}
