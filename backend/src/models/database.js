const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB connection
let isConnected = false;

async function connectToDatabase() {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/admin_portal';

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  about_me: {
    type: String,
    default: null
  },
  street_address: {
    type: String,
    default: null
  },
  city: {
    type: String,
    default: null
  },
  state: {
    type: String,
    default: null
  },
  zip: {
    type: String,
    default: null
  },
  birthdate: {
    type: String,
    default: null
  },
  current_step: {
    type: Number,
    default: 1
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Admin Config Schema
const adminConfigSchema = new mongoose.Schema({
  page_number: {
    type: Number,
    required: true
  },
  component_type: {
    type: String,
    required: true,
    enum: ['about_me', 'address', 'birthdate']
  },
  display_order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound unique index for page_number and component_type
adminConfigSchema.index({ page_number: 1, component_type: 1 }, { unique: true });

// Create models
const User = mongoose.model('User', userSchema);
const AdminConfig = mongoose.model('AdminConfig', adminConfigSchema);

// Initialize database with default configuration
async function initializeDatabase() {
  try {
    await connectToDatabase();

    // Check if admin config exists, if not, create default
    const configCount = await AdminConfig.countDocuments();

    if (configCount === 0) {
      const defaultConfigs = [
        { page_number: 2, component_type: 'about_me', display_order: 0 },
        { page_number: 2, component_type: 'birthdate', display_order: 1 },
        { page_number: 3, component_type: 'address', display_order: 0 }
      ];

      await AdminConfig.insertMany(defaultConfigs);
      console.log('Default admin configuration created');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// User operations
const userOps = {
  create: async (email, password) => {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword
    });
    return user._id;
  },

  findByEmail: async (email) => {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return null;

    // Convert MongoDB document to plain object with id instead of _id
    const userObj = user.toObject();
    userObj.id = userObj._id.toString();
    delete userObj._id;
    delete userObj.__v;

    // Convert timestamps to match SQLite format
    if (userObj.createdAt) {
      userObj.created_at = userObj.createdAt;
      delete userObj.createdAt;
    }
    if (userObj.updatedAt) {
      userObj.updated_at = userObj.updatedAt;
      delete userObj.updatedAt;
    }

    return userObj;
  },

  findById: async (id) => {
    const user = await User.findById(id);
    if (!user) return null;

    // Convert to plain object
    const userObj = user.toObject();
    userObj.id = userObj._id.toString();
    delete userObj._id;
    delete userObj.__v;

    // Convert timestamps
    if (userObj.createdAt) {
      userObj.created_at = userObj.createdAt;
      delete userObj.createdAt;
    }
    if (userObj.updatedAt) {
      userObj.updated_at = userObj.updatedAt;
      delete userObj.updatedAt;
    }

    return userObj;
  },

  updateProgress: async (userId, data) => {
    const updateData = {};

    if (data.about_me !== undefined) updateData.about_me = data.about_me;
    if (data.street_address !== undefined) updateData.street_address = data.street_address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zip !== undefined) updateData.zip = data.zip;
    if (data.birthdate !== undefined) updateData.birthdate = data.birthdate;
    if (data.current_step !== undefined) updateData.current_step = data.current_step;
    if (data.completed !== undefined) updateData.completed = data.completed;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true } // Return updated document
    );

    return user;
  },

  getAll: async () => {
    const users = await User.find().sort({ createdAt: -1 });

    // Convert all users to plain objects with correct field names
    return users.map(user => {
      const userObj = user.toObject();
      userObj.id = userObj._id.toString();
      delete userObj._id;
      delete userObj.__v;

      if (userObj.createdAt) {
        userObj.created_at = userObj.createdAt;
        delete userObj.createdAt;
      }
      if (userObj.updatedAt) {
        userObj.updated_at = userObj.updatedAt;
        delete userObj.updatedAt;
      }

      return userObj;
    });
  },

  verifyPassword: (password, hashedPassword) => {
    return bcrypt.compareSync(password, hashedPassword);
  }
};

// Admin configuration operations
const configOps = {
  getConfig: async () => {
    const configs = await AdminConfig.find().sort({ page_number: 1, display_order: 1 });

    return configs.map(config => ({
      id: config._id.toString(),
      page_number: config.page_number,
      component_type: config.component_type,
      display_order: config.display_order
    }));
  },

  updateConfig: async (configs) => {
    // Use a transaction-like approach
    // Delete all existing configs
    await AdminConfig.deleteMany({});

    // Insert new configs
    const configDocuments = configs.map((config, index) => ({
      page_number: config.page_number,
      component_type: config.component_type,
      display_order: index
    }));

    await AdminConfig.insertMany(configDocuments);
  }
};

module.exports = {
  connectToDatabase,
  initializeDatabase,
  userOps,
  configOps,
  User,
  AdminConfig
};
