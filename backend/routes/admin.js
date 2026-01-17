/**
 * Admin Routes
 * Handles admin-only operations (user management, statistics)
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Expense = require('../models/Expense');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all users (admin only)
router.get('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password') // Exclude passwords
      .sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get admin statistics (admin only)
router.get('/stats', authenticate, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({}); // All users are considered active for now
    
    // Get all expenses across all users
    const allExpenses = await Expense.find({});
    const totalExpenses = allExpenses.length;
    const totalSpending = allExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // Get expenses per user
    const expensesByUser = await Expense.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    res.json({
      totalUsers,
      activeUsers,
      totalExpenses,
      totalSpending,
      expensesByUser
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent admin from deleting themselves
    if (userId === req.userId.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Find user to check if they exist
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user's expenses
    await Expense.deleteMany({ userId: userId });
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user details with expenses (admin only)
router.get('/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const expenses = await Expense.find({ userId: userId }).sort({ date: -1 });
    const totalSpending = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // Get expenses by category
    const expensesByCategory = await Expense.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // Get monthly spending
    const monthlySpending = await Expense.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: { 
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    res.json({
      user,
      expenses: expenses.length,
      totalSpending,
      expensesByCategory,
      monthlySpending,
      expenseList: expenses
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Get expenses for a specific user (admin only)
router.get('/users/:id/expenses', authenticate, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const expenses = await Expense.find({ userId: userId })
      .sort({ date: -1, createdAt: -1 });
    res.json({ expenses });
  } catch (error) {
    console.error('Get user expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch user expenses' });
  }
});

module.exports = router;
