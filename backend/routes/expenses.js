/**
 * Expense Routes
 * Handles CRUD operations for expenses
 */

const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { authenticate } = require('../middleware/auth');

// Get all expenses for authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.userId })
      .sort({ date: -1, createdAt: -1 });
    res.json({ expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expense by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ expense });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Create new expense
router.post('/', authenticate, async (req, res) => {
  try {
    const { amount, description, category, date } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid amount' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Please enter a description' });
    }

    if (!category || !['food', 'transport', 'entertainment', 'utilities', 'shopping', 'healthcare', 'education', 'other'].includes(category)) {
      return res.status(400).json({ error: 'Please select a valid category' });
    }

    if (!date) {
      return res.status(400).json({ error: 'Please select a date' });
    }

    const expense = new Expense({
      userId: req.userId,
      amount: parseFloat(amount),
      description: description.trim(),
      category,
      date: new Date(date)
    });

    await expense.save();

    res.status(201).json({
      message: 'Expense added successfully',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { amount, description, category, date } = req.body;

    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Update fields
    if (amount !== undefined) expense.amount = parseFloat(amount);
    if (description !== undefined) expense.description = description.trim();
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = new Date(date);

    await expense.save();

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Get expenses by category
router.get('/category/:category', authenticate, async (req, res) => {
  try {
    const expenses = await Expense.find({
      userId: req.userId,
      category: req.params.category
    }).sort({ date: -1 });

    res.json({ expenses });
  } catch (error) {
    console.error('Get expenses by category error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expenses by date range
router.get('/date-range/:start/:end', authenticate, async (req, res) => {
  try {
    const startDate = new Date(req.params.start);
    const endDate = new Date(req.params.end);

    const expenses = await Expense.find({
      userId: req.userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    res.json({ expenses });
  } catch (error) {
    console.error('Get expenses by date range error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

module.exports = router;

