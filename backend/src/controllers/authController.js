const { userOps } = require('../models/database');

// Register or login user
exports.authenticate = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    let user = await userOps.findByEmail(email);

    if (user) {
      // User exists, verify password
      if (!userOps.verifyPassword(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.json({ user: userWithoutPassword, message: 'Login successful' });
    } else {
      // Create new user
      const userId = await userOps.create(email, password);
      user = await userOps.findById(userId);
      const { password: _, ...userWithoutPassword } = user;
      return res.status(201).json({ user: userWithoutPassword, message: 'Account created successfully' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.code === 11000) { // MongoDB duplicate key error
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user by ID
exports.getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userOps.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user progress
exports.updateProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = req.body;

    const user = await userOps.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userOps.updateProgress(userId, data);
    const updatedUser = await userOps.findById(userId);
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({ user: userWithoutPassword, message: 'Progress updated successfully' });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
