import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Zu viele Anmeldeversuche. Bitte warte 15 Minuten.' }
});

router.post('/login', loginLimiter, (req, res) => {
  const { pin } = req.body;
  const correctPin = process.env.EDITOR_PIN;

  if (!correctPin) {
    return res.status(500).json({ error: 'PIN nicht konfiguriert' });
  }

  if (pin === correctPin) {
    req.session = { authenticated: true };
    res.cookie('auth', 'true', {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
    return res.json({ ok: true });
  }

  res.status(401).json({ error: 'Falscher PIN' });
});

router.post('/logout', (req, res) => {
  res.clearCookie('auth');
  res.json({ ok: true });
});

router.get('/status', (req, res) => {
  const auth = req.cookies?.auth === 'true';
  res.json({ authenticated: auth });
});

export function requireAuth(req, res, next) {
  if (req.cookies?.auth === 'true') return next();
  res.status(401).json({ error: 'Nicht authentifiziert' });
}

export default router;
