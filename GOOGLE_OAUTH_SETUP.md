# Google OAuth Setup Guide

## Environment Variables

Add the following to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=1014755114483-m0grfioqvs26prhkijfod0u3rhkbedrg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

## Google Cloud Console Configuration

### Authorized Redirect URIs

Add this URI to your Google OAuth 2.0 Client in Google Cloud Console:

**For Development:**
```
http://localhost:3000/api/auth/google/callback
```

**For Production (when deployed):**
```
https://yourdomain.com/api/auth/google/callback
```

### Steps to Configure:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID: `1014755114483-m0grfioqvs26prhkijfod0u3rhkbedrg.apps.googleusercontent.com`
4. Click **Edit**
5. Under **Authorized redirect URIs**, click **Add URI**
6. Add: `http://localhost:3000/api/auth/google/callback`
7. Click **Save**

## Installation

1. Install the required package:
```bash
npm install
```

2. Make sure your `.env` file has all the Google OAuth variables set

3. Restart your server:
```bash
npm start
# or for development
npm run dev
```

## How It Works

1. User clicks "Continue with Google" button on login/signup page
2. Frontend requests OAuth URL from backend (`/api/auth/google`)
3. User is redirected to Google OAuth consent screen
4. User authorizes the application
5. Google redirects back to `/api/auth/google/callback` with authorization code
6. Backend exchanges code for tokens and gets user info
7. Backend creates/finds user in MongoDB
8. Backend generates JWT token
9. User is redirected to login page with token
10. Frontend processes token and logs user in
11. User is redirected to dashboard

## Testing

1. Navigate to `http://localhost:3000/login.html` or `http://localhost:3000/signup.html`
2. Click the "Continue with Google" button
3. Sign in with your Google account
4. You should be redirected back and logged in automatically

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console exactly matches: `http://localhost:3000/api/auth/google/callback`
- Check that your `.env` file has `GOOGLE_REDIRECT_URI` set correctly

### Error: "invalid_client"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your `.env` file
- Make sure there are no extra spaces or quotes

### Error: "OAuth authentication failed"
- Check server logs for detailed error messages
- Verify MongoDB connection is working
- Ensure all environment variables are set correctly
