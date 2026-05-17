import axios from 'axios';

export interface FXRates {
  USDC_USD: number;
  EURC_USD: number;
  timestamp: string;
}

// Uses open exchange rates (free tier) or similar
export async function fetchFXRates(): Promise<FXRates> {
  try {
    // Frankfurter is a free, no-key-needed FX API
    const res = await axios.get(
      'https://api.frankfurter.app/latest?from=USD&to=EUR'
    );
    const eurRate = res.data.rates.EUR;
    return {
      USDC_USD: 1.0,
      EURC_USD: eurRate,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[FX] Failed to fetch rates:', err);
    return { USDC_USD: 1.0, EURC_USD: 0.92, timestamp: new Date().toISOString() };
  }
}

export function shouldSettle(rates: FXRates, threshold = 0.001): boolean {
  // Bond settles when EUR/USD rate deviation crosses threshold
  // In production: compare against moving average or prediction
  const target = 0.92; // example baseline
  const deviation = Math.abs(rates.EURC_USD - target) / target;
  return deviation > threshold;
}
