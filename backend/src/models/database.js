const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '../../database.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      about_me TEXT,
      street_address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      birthdate TEXT,
      current_step INTEGER DEFAULT 1,
      completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Admin configuration table - stores which components appear on which pages
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_number INTEGER NOT NULL,
      component_type TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      UNIQUE(page_number, component_type)
    )
  `);

  // Initialize default configuration if empty
  const configCount = db.prepare('SELECT COUNT(*) as count FROM admin_config').get();
  if (configCount.count === 0) {
    const insert = db.prepare('INSERT INTO admin_config (page_number, component_type, display_order) VALUES (?, ?, ?)');
    const insertMany = db.transaction((configs) => {
      for (const config of configs) insert.run(config.page, config.type, config.order);
    });

    // Default: Page 2 has About Me and Birthdate, Page 3 has Address
    insertMany([
      { page: 2, type: 'about_me', order: 0 },
      { page: 2, type: 'birthdate', order: 1 },
      { page: 3, type: 'address', order: 0 }
    ]);
  }

  console.log('Database initialized successfully');
}

// User operations
const userOps = {
  create: (email, password) => {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    const result = stmt.run(email, hashedPassword);
    return result.lastInsertRowid;
  },

  findByEmail: (email) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  updateProgress: (userId, data) => {
    const fields = [];
    const values = [];

    if (data.about_me !== undefined) {
      fields.push('about_me = ?');
      values.push(data.about_me);
    }
    if (data.street_address !== undefined) {
      fields.push('street_address = ?');
      values.push(data.street_address);
    }
    if (data.city !== undefined) {
      fields.push('city = ?');
      values.push(data.city);
    }
    if (data.state !== undefined) {
      fields.push('state = ?');
      values.push(data.state);
    }
    if (data.zip !== undefined) {
      fields.push('zip = ?');
      values.push(data.zip);
    }
    if (data.birthdate !== undefined) {
      fields.push('birthdate = ?');
      values.push(data.birthdate);
    }
    if (data.current_step !== undefined) {
      fields.push('current_step = ?');
      values.push(data.current_step);
    }
    if (data.completed !== undefined) {
      fields.push('completed = ?');
      values.push(data.completed ? 1 : 0);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values);
  },

  getAll: () => {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all();
  },

  verifyPassword: (password, hashedPassword) => {
    return bcrypt.compareSync(password, hashedPassword);
  }
};

// Admin configuration operations
const configOps = {
  getConfig: () => {
    const stmt = db.prepare('SELECT * FROM admin_config ORDER BY page_number, display_order');
    return stmt.all();
  },

  updateConfig: (configs) => {
    const deleteStmt = db.prepare('DELETE FROM admin_config');
    const insertStmt = db.prepare('INSERT INTO admin_config (page_number, component_type, display_order) VALUES (?, ?, ?)');

    const transaction = db.transaction(() => {
      deleteStmt.run();
      configs.forEach((config, index) => {
        insertStmt.run(config.page_number, config.component_type, index);
      });
    });

    transaction();
  }
};

module.exports = {
  db,
  initializeDatabase,
  userOps,
  configOps
};
