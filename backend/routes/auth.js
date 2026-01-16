/**
 * Authentication Routes
 * Handles login, signup, and authentication
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Settings = require('../models/Settings');
const Budget = require('../models/Budget');
const { generateToken, authenticate } = require('../middleware/auth');

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      isAdmin: email.toLowerCase() === 'admintrust@email.com'
    });

    await user.save();

    // Create default settings
    const settings = new Settings({
      userId: user._id,
      theme: 'light',
      currency: 'USD'
    });
    await settings.save();

    // Create default budget
    const budget = new Budget({
      userId: user._id,
      monthlyBudget: 3000
    });
    await budget.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({ user: req.user.toJSON() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Verify token
router.get('/verify', authenticate, (req, res) => {
  res.json({ valid: true, user: req.user.toJSON() });
});

module.exports = router;

