/**
 * Google OAuth Routes
 * Handles Google OAuth authentication flow
 */

const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Settings = require('../models/Settings');
const Budget = require('../models/Budget');
const { generateToken } = require('../middleware/auth');

// Get Google OAuth client (lazy initialization)
function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.');
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

// Get Google OAuth URL
router.get('/google', (req, res) => {
  try {
    // Validate environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials missing:', {
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
      });
      return res.status(500).json({ 
        error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.' 
      });
    }

    const client = getOAuthClient();
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;
    
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      prompt: 'consent',
      redirect_uri: redirectUri
    });

    console.log('Generated Google OAuth URL with client ID:', process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...');
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google OAuth URL:', error);
    res.status(500).json({ error: error.message || 'Failed to generate OAuth URL' });
  }
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login.html?error=no_code`);
    }

    // Validate environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials missing in callback');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login.html?error=oauth_failed`);
    }

    const client = getOAuthClient();
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`;
    
    // Exchange code for tokens
    const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
    
    client.setCredentials(tokens);

    // Improved Google profile picture retrieval using userinfo API
    let googleUserInfo = {};
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });
      googleUserInfo = await response.json();
    } catch (error) {
      console.error('Error fetching Google user info:', error);
      // Fallback to ID token payload
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      googleUserInfo = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        verified_email: payload.email_verified
      };
    }

    const { id: googleId, email, name, picture, verified_email } = googleUserInfo;

    if (!email) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login.html?error=no_email`);
    }

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { googleId: googleId }
      ]
    });

    if (user) {
      // Update existing user with Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
      }
      // Always update profile picture from Google if available
      if (picture) {
        user.profilePicture = picture;
      }
      await user.save();
    } else {
      // Create new user
      user = new User({
        name: name || 'User',
        email: email.toLowerCase(),
        googleId: googleId,
        authProvider: 'google',
        profilePicture: picture || null, // Save Google profile picture or null
        isAdmin: email.toLowerCase() === 'admintrust@email.com',
        password: null // No password for OAuth users
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
    }

    // Generate JWT token
    const token = generateToken(user._id);

    console.log('OAuth callback successful for user:', user.email);
    console.log('Generated token, redirecting to:', `${frontendUrl}/dashboard.html?token=${token}&googleAuth=true`);

    // Redirect directly to dashboard with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard.html?token=${token}&googleAuth=true`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login.html?error=oauth_failed`);
  }
});

// Verify Google token (for frontend verification)
router.post('/google/verify', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    const client = getOAuthClient();
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { googleId: googleId }
      ]
    });

    if (!user) {
      // Create new user
      user = new User({
        name: name || 'User',
        email: email.toLowerCase(),
        googleId: googleId,
        authProvider: 'google',
        profilePicture: picture || null,
        isAdmin: email.toLowerCase() === 'admintrust@email.com',
        password: null
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
    } else {
      // Update existing user with Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
      }
      // Always update profile picture from Google if available
      if (picture) {
        user.profilePicture = picture;
      }
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      message: 'Google authentication successful',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Google token verification error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

module.exports = router;
