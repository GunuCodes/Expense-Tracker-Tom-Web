# Expense Tracker - AI Coding Guidelines

## Architecture Overview
This is a full-stack expense tracking web application with:
- **Frontend**: Vanilla JavaScript SPA (no framework) using HTML/CSS/JS
- **Backend**: Node.js/Express server with RESTful API endpoints
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens + Google OAuth integration

Key data flow: Frontend → API calls to `/api/*` → Express routes → MongoDB models → Response

## Essential Developer Workflows
- **Start development server**: `npm run dev` (uses nodemon for auto-reload)
- **Start production server**: `npm start`
- **MongoDB setup**: Configure `MONGODB_URI` in `.env` (local: `mongodb://localhost:27017/expense-tracker` or Atlas cloud)
- **Environment**: Copy `env.template` to `.env`, set `JWT_SECRET`, Google OAuth credentials
- **Admin account**: Auto-created on server start (email: `admintrust@email.com`, password: `admin123`)

## Code Organization Patterns
- **Backend structure**: `/backend/{models,routes,middleware}` - keep all server logic here
- **Frontend JS**: `/js/` folder with one file per feature (e.g., `auth.js`, `dashboard.js`)
- **API client**: Use `API` object from `js/api.js` for all backend communication
- **Models**: Mongoose schemas in `/backend/models/` with validation and pre-save hooks
- **Routes**: RESTful endpoints in `/backend/routes/` following CRUD patterns

## Authentication & Security
- **JWT handling**: Store tokens in `localStorage` as `expenseTrackerToken`
- **API requests**: Include `Authorization: Bearer ${token}` header for protected routes
- **Google OAuth**: Configured via environment variables, callback at `/api/auth/google/callback`
- **Password hashing**: Use `bcryptjs` for user passwords

## Common Patterns & Conventions
- **Error handling**: Frontend API calls use try/catch, backend uses Express error middleware
- **Data validation**: Server-side validation in routes, client-side in forms
- **SPA routing**: Server serves `index.html` for all non-API routes (fallback routing)
- **Static files**: Served from root directory via `express.static()`
- **Admin features**: Check `user.isAdmin` flag for admin-only functionality

## Key Files to Reference
- `server.js`: Main Express app setup and route mounting
- `js/api.js`: Centralized API client with auth headers
- `backend/models/User.js`: User schema with OAuth fields
- `backend/routes/auth.js`: Authentication endpoints
- `package.json`: Dependencies and npm scripts</content>
<parameter name="filePath">c:\Users\carlo\Documents\the\Expense Tracker - Copy\.github\copilot-instructions.md