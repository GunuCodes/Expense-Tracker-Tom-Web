/**
 * Settings Routes
 * Handles user settings operations
 */

const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { authenticate } = require('../middleware/auth');

// Get user settings
router.get('/', authenticate, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.userId });

    if (!settings) {
      // Create default settings if they don't exist
      settings = new Settings({
        userId: req.userId,
        theme: 'light',
        currency: 'USD'
      });
      await settings.save();
    }

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/', authenticate, async (req, res) => {
  try {
    const { theme, currency, dateFormat, notifications } = req.body;

    let settings = await Settings.findOne({ userId: req.userId });

    if (!settings) {
      settings = new Settings({ userId: req.userId });
    }

    if (theme !== undefined) {
      if (!['light', 'dark'].includes(theme)) {
        return res.status(400).json({ error: 'Invalid theme value' });
      }
      settings.theme = theme;
    }

    if (currency !== undefined) {
      if (!['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'PHP'].includes(currency)) {
        return res.status(400).json({ error: 'Invalid currency value' });
      }
      settings.currency = currency;
    }

    if (dateFormat !== undefined) {
      settings.dateFormat = dateFormat;
    }

    if (notifications !== undefined) {
      settings.notifications = notifications;
    }

    await settings.save();

    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;

