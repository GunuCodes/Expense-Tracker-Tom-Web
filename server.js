require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./backend/routes/auth');
const googleAuthRoutes = require('./backend/routes/google-auth');
const expenseRoutes = require('./backend/routes/expenses');
const userRoutes = require('./backend/routes/users');
const settingsRoutes = require('./backend/routes/settings');
const budgetRoutes = require('./backend/routes/budget');
const adminRoutes = require('./backend/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname)));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker';

mongoose.connect(MONGODB_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  try {
    const initAdmin = require('./backend/scripts/initAdmin');
    await initAdmin();
  } catch (error) {
    console.error('⚠️  Warning: Could not initialize admin account:', error.message);
  }
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

mongoose.connect(MONGODB_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  try {
    const initAdmin = require('./backend/scripts/initAdmin');
    await initAdmin();
  } catch (error) {
    console.error('⚠️  Warning: Could not initialize admin account:', error.message);
  }
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// SPA routing - serve static files and fallback to index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  const filePath = path.join(__dirname, req.path === '/' ? 'index.html' : req.path);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).sendFile(path.join(__dirname, 'index.html'));
    }
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 MongoDB URI: ${MONGODB_URI}`);
});

module.exports = app;

