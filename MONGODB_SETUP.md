# MongoDB Setup Guide

This application uses MongoDB with Mongoose for data persistence. You can use either a local MongoDB installation or MongoDB Atlas (cloud-hosted).

## Option 1: MongoDB Atlas (Recommended for Production)

MongoDB Atlas is a free cloud-hosted MongoDB service, perfect for production deployments.

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" and create an account
3. Choose the **FREE** tier (M0 Sandbox)

### Step 2: Create a Cluster

1. After logging in, click "Build a Database"
2. Choose the **FREE** tier (M0)
3. Select a cloud provider and region (choose one close to your deployment location)
4. Name your cluster (e.g., "AdminPortal")
5. Click "Create"

### Step 3: Create Database User

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and strong password
5. **IMPORTANT**: Save these credentials securely!
6. Set "Database User Privileges" to "Read and write to any database"
7. Click "Add User"

### Step 4: Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development, click "Allow Access from Anywhere" (0.0.0.0/0)
   - **Note**: For production, restrict to your server's IP
4. Click "Confirm"

### Step 5: Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as the driver
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Configure Your Application

1. Open `backend/.env` file
2. Replace the `MONGODB_URI` value with your Atlas connection string
3. Replace `<username>` with your database username
4. Replace `<password>` with your database password
5. Add a database name (e.g., `admin_portal`) before the `?`:
   ```env
   MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/admin_portal?retryWrites=true&w=majority
   ```

**Example:**
```env
MONGODB_URI=mongodb+srv://admin:MySecurePass123@cluster0.mongodb.net/admin_portal?retryWrites=true&w=majority
```

### Step 7: Test the Connection

```bash
cd backend
npm start
```

You should see:
```
MongoDB connected successfully
Database initialized successfully
Server is running on port 3001
```

---

## Option 2: Local MongoDB (Development Only)

If you want to run MongoDB locally for development:

### Install MongoDB

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

**Windows:**
1. Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Start MongoDB as a service

### Configure Local Connection

In your `backend/.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/admin_portal
```

### Test Local Connection

```bash
cd backend
npm start
```

---

## For Render Deployment

When deploying to Render:

1. Use MongoDB Atlas (Option 1 above)
2. In Render dashboard, go to your backend service
3. Go to "Environment" tab
4. Add environment variable:
   - **Key**: `MONGODB_URI`
   - **Value**: Your MongoDB Atlas connection string
5. Click "Save Changes"
6. Render will automatically redeploy with the new environment variable

---

## Database Collections

The application creates two collections:

1. **users** - Stores user accounts and onboarding data
   - email, password (hashed), about_me, address fields, birthdate
   - current_step, completed status, timestamps

2. **adminconfigs** - Stores form configuration
   - page_number, component_type, display_order
   - Default configuration is created automatically on first run

---

## Troubleshooting

### "MongooseServerSelectionError: connect ECONNREFUSED"

**Issue**: Can't connect to MongoDB

**Solutions**:
- For Atlas: Check your connection string is correct
- For Atlas: Ensure IP address is whitelisted (0.0.0.0/0 for testing)
- For Local: Ensure MongoDB is running (`brew services list` on macOS)
- Check username and password are correct
- Verify network connectivity

### "MongooseError: Operation users.insertOne() buffering timed out"

**Issue**: Database connection is slow or blocked

**Solutions**:
- Check network access settings in Atlas
- Verify connection string is correct
- Check firewall settings

### "Authentication failed"

**Issue**: Wrong username or password

**Solutions**:
- Double-check credentials in Atlas
- Ensure special characters in password are URL-encoded
  - `@` becomes `%40`
  - `#` becomes `%23`
  - `$` becomes `%24`

### Connection String URL Encoding

If your password contains special characters, encode them:

```javascript
// Example password: MyPass@123#
// Encoded: MyPass%40123%23

MONGODB_URI=mongodb+srv://user:MyPass%40123%23@cluster.mongodb.net/admin_portal
```

---

## Verify Your Database

### View Data in MongoDB Atlas

1. Go to MongoDB Atlas dashboard
2. Click "Browse Collections"
3. Select your database (`admin_portal`)
4. View `users` and `adminconfigs` collections

### Using MongoDB Compass (Desktop App)

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Paste your connection string
3. Connect and browse your data visually

### Using MongoDB Shell

```bash
# Connect to Atlas
mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net" --username youruser

# Switch to database
use admin_portal

# View collections
show collections

# View users
db.users.find()

# View config
db.adminconfigs.find()
```

---

## Migration from SQLite

The application has been migrated from SQLite to MongoDB. All existing functionality remains the same:

- User authentication and registration
- Progress tracking across onboarding flow
- Admin configuration management
- Data table display

The only difference is the backend database - the API and frontend remain unchanged.

---

## Security Best Practices

1. **Never commit `.env` files** to git
2. **Use strong passwords** for database users
3. **Restrict IP access** in production (not 0.0.0.0/0)
4. **Rotate credentials** regularly
5. **Use environment variables** for all sensitive data
6. **Enable MongoDB encryption** at rest (available in Atlas)

---

## Need Help?

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB University](https://university.mongodb.com/) - Free courses
