import { Router } from 'express';

const router = Router();

// Auth routes (sign up, login, logout, etc.)
router.post('/signup', (req, res) => {
  res.json({ message: 'Signup endpoint' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint' });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout endpoint' });
});

router.post('/refresh-token', (req, res) => {
  res.json({ message: 'Refresh token endpoint' });
});

module.exports = router;
