import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Working endpoint' });
});

module.exports = router;
