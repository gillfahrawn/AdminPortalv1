# Admin Portal MVP - User Onboarding System

A full-stack React application for user onboarding with a customizable admin configuration system.

## Features

### 1. User Onboarding Flow (3-Page Wizard)
- **Page 1**: Email and password authentication (creates account or logs in)
- **Pages 2 & 3**: Dynamic form components that can be configured via admin panel
- Progress indicator showing user's position in the onboarding flow
- Automatic progress saving - users can leave and return to their saved position
- Completes with a success page after finishing all steps

### 2. Admin Configuration Panel (`/admin`)
- Configure which components appear on pages 2 and 3
- Three available components:
  - **About Me**: Large text area for user bio
  - **Address**: Street address, city, state, and ZIP code fields
  - **Date of Birth**: Date picker for birthdate selection
- Each page must have at least one component
- Changes take effect immediately for new and incomplete onboarding flows
- No authentication required (for demo purposes)

### 3. Data Table View (`/data`)
- Displays all user data from the database in an HTML table
- Auto-refreshes every 5 seconds to show new submissions
- Shows all user fields including onboarding progress
- No authentication required (for demo purposes)

## Technology Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Axios** for API calls
- Context API for state management
- Inline CSS styling

### Backend
- **Node.js** with Express
- **better-sqlite3** for SQLite database
- **bcrypt** for password hashing
- RESTful API architecture

### Database
- **SQLite** - Lightweight, file-based database
- Two main tables:
  - `users` - User accounts and onboarding data
  - `admin_config` - Form component configuration

## Project Structure

```
AdminPortalv1/
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── AboutMeComponent.jsx
│   │   │   ├── AddressComponent.jsx
│   │   │   ├── BirthdateComponent.jsx
│   │   │   └── ProgressIndicator.jsx
│   │   ├── contexts/          # React contexts
│   │   │   └── AuthContext.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Onboarding.jsx
│   │   │   ├── Success.jsx
│   │   │   ├── Admin.jsx
│   │   │   └── Data.jsx
│   │   ├── services/          # API service
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── controllers/       # Request handlers
    │   │   ├── authController.js
    │   │   ├── adminController.js
    │   │   └── dataController.js
    │   ├── models/            # Database models
    │   │   └── database.js
    │   ├── routes/            # API routes
    │   │   ├── authRoutes.js
    │   │   ├── adminRoutes.js
    │   │   └── dataRoutes.js
    │   └── server.js
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AdminPortalv1
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running Locally

You'll need two terminal windows:

**Terminal 1 - Backend Server:**
```bash
cd backend
npm start
```
Backend runs on `http://localhost:3001`

**Terminal 2 - Frontend Development Server:**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173` (or the port Vite assigns)

### Access the Application

- **Main App (Onboarding)**: `http://localhost:5173/`
- **Admin Panel**: `http://localhost:5173/admin`
- **Data Table**: `http://localhost:5173/data`

## Navigation

The application includes easy navigation between all major sections:

### From the Data Table (`/data`):
- **Admin Config** button - Navigate to the Admin Configuration panel
- **Back to Home** button - Return to the main onboarding page

### From the Admin Panel (`/admin`):
- **View Data** button - Navigate to the Data Table
- **Back to Home** button - Return to the main onboarding page

### From the Success Page (after completing onboarding):
- **View All Data** button - Navigate to the Data Table to see all submissions
- **Admin Config** button - Navigate to the Admin panel to modify form configuration
- **Logout** button - Log out and return to the login page

### Direct URL Access:
You can also directly access any page by typing the URL:
- `/` - Main onboarding page
- `/admin` - Admin configuration panel
- `/data` - Data table view
- `/success` - Success page (shown after completing onboarding)

## API Endpoints

### Authentication
- `POST /api/auth/authenticate` - Create account or login
- `GET /api/auth/user/:userId` - Get user by ID
- `PUT /api/auth/user/:userId/progress` - Update user progress

### Admin Configuration
- `GET /api/admin/config` - Get current configuration
- `PUT /api/admin/config` - Update configuration

### Data
- `GET /api/data/users` - Get all users

## User Flow

1. **First Visit**: User enters email and password on page 1
   - If email doesn't exist, account is created
   - If email exists, password is verified

2. **Onboarding Pages 2 & 3**: User fills out dynamic form components
   - Progress is saved after each page
   - User can leave and return to their saved position

3. **Completion**: After page 3, user is redirected to success page
   - User marked as "completed" in database

4. **Returning Users**: If user tries to start again with same email
   - Automatically directed to their last incomplete step
   - Or to success page if already completed

## Default Configuration

By default, the system is configured with:
- **Page 2**: About Me, Date of Birth
- **Page 3**: Address

Admins can change this via the `/admin` page.

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password` - Hashed password
- `about_me` - About me text
- `street_address`, `city`, `state`, `zip` - Address fields
- `birthdate` - Date of birth
- `current_step` - Current onboarding step (1-3)
- `completed` - Boolean flag
- `created_at`, `updated_at` - Timestamps

### Admin Config Table
- `id` - Primary key
- `page_number` - Page number (2 or 3)
- `component_type` - Component type (about_me, address, birthdate)
- `display_order` - Order on the page

## Deployment

### Backend Deployment (Render, Heroku, etc.)

1. Set environment variable: `PORT` (default: 3001)
2. Build command: `npm install`
3. Start command: `npm start`

### Frontend Deployment (Vercel, Netlify, etc.)

1. Set environment variable: `VITE_API_URL` to your backend URL
2. Build command: `npm run build`
3. Output directory: `dist`

### Deploy to Vercel (Recommended)

**Frontend:**
```bash
cd frontend
npm install -g vercel
vercel
```

**Backend:**
```bash
cd backend
vercel
```

Then update the frontend's `VITE_API_URL` environment variable to point to the deployed backend.

## Environment Variables

### Backend (`.env`)
```env
PORT=3001
NODE_ENV=development
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3001/api
```

## Development Notes

- Passwords are hashed using bcrypt before storage
- SQLite database file (`database.db`) is created automatically
- User authentication is simplified for MVP (no JWT tokens)
- Admin panel has no authentication (intentional for demo)
- Data table has no authentication (intentional for demo)

## Testing the Application

1. **Test User Onboarding**:
   - Go to `http://localhost:5173/`
   - Create an account with email/password
   - Complete pages 2 and 3
   - Verify success page appears

2. **Test Progress Persistence**:
   - Start onboarding, complete page 2
   - Refresh the browser
   - Log in again - should resume at page 3

3. **Test Admin Panel**:
   - Go to `http://localhost:5173/admin` (or click "Admin Config" from the Data Table)
   - View current configuration showing components on pages 2 and 3
   - Move components between pages using "Move to Page X" buttons
   - Save configuration and verify success message
   - Use "View Data" button to check the data table
   - Start new onboarding to see changes reflected in the form

4. **Test Data Table**:
   - Go to `http://localhost:5173/data` (or click "View All Data" from Success page)
   - Verify user data appears in the table
   - Click "Admin Config" button to navigate to admin panel
   - Complete another onboarding
   - Return to data table - it will auto-refresh to show new data (or wait 5 seconds)

5. **Test Navigation**:
   - Complete an onboarding flow and reach the success page
   - Click "View All Data" to see the data table
   - Click "Admin Config" to modify form configuration
   - Verify "Back to Home" button works from both pages
   - Test direct URL access to `/admin`, `/data`, and `/`

## Troubleshooting

**Backend won't start:**
- Check if port 3001 is already in use
- Ensure all dependencies are installed: `npm install`

**Frontend API calls fail:**
- Verify backend is running on port 3001
- Check browser console for CORS errors
- Ensure `VITE_API_URL` is set correctly

**Database errors:**
- Delete `backend/database.db` to reset database
- Restart backend to recreate with default config

## Future Enhancements

- JWT authentication with proper session management
- Admin authentication and authorization
- Email verification for new accounts
- Form validation with error messages
- Component ordering in admin panel
- Export data as CSV from data table
- Dark mode support
- Mobile responsive improvements
- Unit and integration tests

## License

MIT License - See LICENSE file for details
