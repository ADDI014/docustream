const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.user_email, role: user.role, name: user.user_name },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  console.log('REGISTER BODY:', req.body);
  try {
    const { user_name, user_email, password } = req.body;

    if (!user_name || !user_email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existing = await User.findOne({ user_email: user_email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({ user_name, user_email, password });
    const token = signToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.user_name,
        email: user.user_email,
        role: user.role,
        upload_count: user.upload_count
      }
    });
  } catch (err) {
  console.error('REGISTER ERROR:', err);

  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Email already registered'
    });
  }

  res.status(500).json({
    error: err.message
  });
}
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { user_email, password } = req.body;

    if (!user_email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ user_email: user_email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.last_login = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.user_name,
        email: user.user_email,
        role: user.role,
        upload_count: user.upload_count
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({
    user: {
      id: req.user._id || req.user.id,
      name: req.user.user_name || req.user.name,
      email: req.user.user_email || req.user.email,
      role: req.user.role,
      upload_count: req.user.upload_count
    }
  });
});

module.exports = router;