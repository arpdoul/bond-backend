import { Router } from 'express';
import { fetchFXRates } from '../services/fx';

const router = Router();

router.get('/', async (req, res) => {
  const rates = await fetchFXRates();
  res.json(rates);
});

export default router;
