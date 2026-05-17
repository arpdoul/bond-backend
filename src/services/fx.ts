import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export interface FXRates {
  USDC_USD: number;
  EURC_USD: number;
  timestamp: string;
}

export async function fetchFXRates(): Promise<FXRates> {
  try {
    const res = await axios.get('https://api.frankfurter.app/latest?from=USD&to=EUR');
    return {
      USDC_USD: 1.0,
      EURC_USD: res.data.rates.EUR,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return { USDC_USD: 1.0, EURC_USD: 0.92, timestamp: new Date().toISOString() };
  }
}

export function shouldSettle(rates: FXRates): boolean {
  const baseline = parseFloat(process.env.FX_BASELINE || '0.92');
  const threshold = parseFloat(process.env.FX_THRESHOLD || '0.001');
  const deviation = Math.abs(rates.EURC_USD - baseline) / baseline;
  return deviation > threshold;
}
