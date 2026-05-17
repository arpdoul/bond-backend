import { Router } from 'express';
import { settlementHistory } from '../agent/engine';

const router = Router();

router.get('/', (req, res) => {
  res.json(settlementHistory);
});

export default router;
