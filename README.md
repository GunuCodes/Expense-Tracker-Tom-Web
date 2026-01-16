# Expense Tracker - MongoDB Backend Integration

Personal Expense Tracker application with MongoDB backend integration.

## Features

- User authentication with MongoDB
- Expense tracking and management
- Budget management
- User settings and preferences
- Dark mode support
- Profile picture upload

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas connection string)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update `MONGODB_URI` with your MongoDB connection string
   - Update `JWT_SECRET` with a secure secret key

3. Start MongoDB:
   - If using local MongoDB, ensure it's running on `mongodb://localhost:27017`
   - Or use MongoDB Atlas connection string

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## MongoDB Setup

### Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/expense-tracker`

### MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env` file

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify` - Verify token

### Expenses
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/:id` - Get expense by ID
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

### Budget
- `GET /api/budget` - Get user budget
- `PUT /api/budget` - Update user budget

## Project Structure

```
.
├── backend/
│   ├── models/          # MongoDB models
│   │   ├── User.js
│   │   ├── Expense.js
│   │   ├── Settings.js
│   │   └── Budget.js
│   ├── routes/          # API routes
│   │   ├── auth.js
│   │   ├── expenses.js
│   │   ├── users.js
│   │   ├── settings.js
│   │   └── budget.js
│   └── middleware/      # Middleware
│       └── auth.js
├── js/
│   ├── api.js          # API client
│   ├── app.js          # Main application
│   ├── auth.js         # Authentication
│   └── ...
├── server.js           # Express server
├── package.json        # Dependencies
└── .env               # Environment variables
```

## Default Admin Account

The system automatically creates an admin account:
- Email: `admintrust@email.com`
- Password: `admin123`

## Development Notes

- The frontend uses the API client (`js/api.js`) to communicate with the backend
- All user data is stored in MongoDB
- JWT tokens are used for authentication
- Passwords are hashed using bcrypt

## License

ISC

