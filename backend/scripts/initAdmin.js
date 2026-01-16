/**
 * Initialize Admin Account
 * Creates the default admin account in MongoDB if it doesn't exist
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Settings = require('../models/Settings');
const Budget = require('../models/Budget');
require('dotenv').config();

const ADMIN_EMAIL = 'admintrust@email.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Admin User';

async function initAdmin() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker';
    
    // Check if already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB for admin initialization');
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('✅ Admin account already exists');
      // Ensure isAdmin flag is set
      if (!existingAdmin.isAdmin) {
        existingAdmin.isAdmin = true;
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin');
      }
      return;
    }

    // Create admin user
    const admin = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD, // Will be hashed by pre-save hook
      isAdmin: true
    });

    await admin.save();
    console.log('✅ Admin account created successfully');

    // Create default settings for admin
    const settings = new Settings({
      userId: admin._id,
      theme: 'light',
      currency: 'USD'
    });
    await settings.save();
    console.log('✅ Admin settings created');

    // Create default budget for admin
    const budget = new Budget({
      userId: admin._id,
      monthlyBudget: 3000
    });
    await budget.save();
    console.log('✅ Admin budget created');

    console.log(`\n📧 Admin Credentials:`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}\n`);

  } catch (error) {
    console.error('❌ Error initializing admin account:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initAdmin()
    .then(() => {
      console.log('✅ Admin initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Admin initialization failed:', error);
      process.exit(1);
    });
}

module.exports = initAdmin;

