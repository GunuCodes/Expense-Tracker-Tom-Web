/**
 * User Routes
 * Handles user profile operations
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, profilePicture } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name !== undefined) {
      if (!name || name.length < 2) {
        return res.status(400).json({ error: 'Display name must be at least 2 characters long' });
      }
      user.name = name.trim();
    }

    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;

