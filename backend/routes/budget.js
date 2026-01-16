/**
 * Budget Routes
 * Handles budget operations
 */

const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const { authenticate } = require('../middleware/auth');

// Get user budget
router.get('/', authenticate, async (req, res) => {
  try {
    let budget = await Budget.findOne({ userId: req.userId });

    if (!budget) {
      // Create default budget if it doesn't exist
      budget = new Budget({
        userId: req.userId,
        monthlyBudget: 3000
      });
      await budget.save();
    }

    res.json({ budget });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// Update user budget
router.put('/', authenticate, async (req, res) => {
  try {
    const { monthlyBudget } = req.body;

    if (monthlyBudget !== undefined) {
      if (monthlyBudget < 0) {
        return res.status(400).json({ error: 'Monthly budget must be a positive number' });
      }
    }

    let budget = await Budget.findOne({ userId: req.userId });

    if (!budget) {
      budget = new Budget({ userId: req.userId });
    }

    if (monthlyBudget !== undefined) {
      budget.monthlyBudget = parseFloat(monthlyBudget);
    }

    await budget.save();

    res.json({
      message: 'Budget updated successfully',
      budget
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

module.exports = router;

