# Server Setup Guide

## Step 1: Install Dependencies

Make sure you have Node.js installed (v14 or higher), then run:

```bash
npm install
```

This will install all required packages:
- express
- mongoose
- cors
- dotenv
- bcryptjs
- jsonwebtoken

## Step 2: Set Up MongoDB

You have two options:

### Option A: Local MongoDB

1. Install MongoDB locally from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. The default connection string is already set in `.env`: `mongodb://localhost:27017/expense-tracker`

### Option B: MongoDB Atlas (Cloud - Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier)
4. Create a database user (Database Access)
5. Whitelist your IP address (Network Access)
6. Get your connection string (Connect > Connect your application)
7. Update `MONGODB_URI` in `.env` file with your Atlas connection string

Example Atlas connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/expense-tracker?retryWrites=true&w=majority
```

## Step 3: Configure Environment Variables

The `.env` file has been created with default values. You may need to update:

1. **MONGODB_URI**: Your MongoDB connection string
   - Local: `mongodb://localhost:27017/expense-tracker`
   - Atlas: Your connection string from MongoDB Atlas

2. **JWT_SECRET**: Change this to a random secure string (optional for development, required for production)
   - You can generate one using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

3. **PORT**: Server port (default: 3000)

## Step 4: Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Restarting the Server

To restart the server:

1. **Stop the server:** Press `Ctrl + C` in the terminal where the server is running
2. **Start again:** Run `npm start` or `npm run dev`

**Note:** If you're using `npm run dev` (nodemon), the server will automatically restart when you make code changes. You only need to manually restart if you change environment variables (`.env` file) or install new packages.

## Step 5: Verify Setup

1. Open your browser to `http://localhost:3000`
2. You should see the landing page
3. Try signing up a new account
4. Check MongoDB to see if the user was created

## Troubleshooting

### MongoDB Connection Error

- **Local MongoDB**: Make sure MongoDB service is running
  - Windows: Check Services, start "MongoDB"
  - Mac/Linux: `sudo systemctl start mongod` or `brew services start mongodb-community`

- **MongoDB Atlas**: 
  - Verify your connection string is correct
  - Check that your IP is whitelisted
  - Verify database user credentials

### Port Already in Use

If port 3000 is already in use, either:
- Change `PORT` in `.env` to a different port (e.g., 3001)
- Or stop the process using port 3000

### Module Not Found Errors

Run `npm install` again to ensure all dependencies are installed.

## Default Admin Account

The system **automatically creates** an admin account in MongoDB when the server starts:
- **Email:** `admintrust@email.com`
- **Password:** `admin123`
- **Name:** Admin User

The admin account is created automatically on server startup. If it already exists, the server will skip creation and just verify the account exists.

### Manual Admin Creation

If you need to manually create the admin account, you can run:

```bash
node backend/scripts/initAdmin.js
```

Or simply sign up with the email `admintrust@email.com` - the system will automatically set the `isAdmin` flag to `true` for this email.

