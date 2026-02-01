import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database connection
const db = new sqlite3.Database(join(__dirname, 'eco_tracker.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database with schema
function initializeDatabase() {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  db.exec(schema, (err) => {
    if (err) {
      console.error('Error initializing database:', err.message);
    } else {
      console.log('✅ Database schema initialized');
      // Run migration to fix events table constraint
      migrateEventsTable();
    }
  });
}

// Migration to update events table status constraint
function migrateEventsTable() {
  db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='events'", (err, row) => {
    if (err) {
      console.error('Migration check error:', err.message);
      return;
    }
    
    if (row && row.sql && !row.sql.includes("'pending'")) {
      console.log('🔧 Migrating events table to include pending status...');
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Create new table with correct constraint
        db.run(`
          CREATE TABLE events_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            event_type TEXT CHECK(event_type IN ('cleanup', 'awareness', 'workshop', 'other')) NOT NULL,
            location TEXT,
            event_date DATETIME NOT NULL,
            organizer_id INTEGER NOT NULL,
            max_participants INTEGER,
            eco_points_reward INTEGER DEFAULT 10,
            status TEXT CHECK(status IN ('pending', 'upcoming', 'ongoing', 'completed', 'cancelled')) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organizer_id) REFERENCES users(id)
          )
        `, (err) => {
          if (err) console.error('Create new table error:', err.message);
        });
        
        // Copy data from old table
        db.run(`
          INSERT INTO events_new SELECT * FROM events
        `, (err) => {
          if (err) console.error('Copy data error:', err.message);
        });
        
        // Drop old table
        db.run('DROP TABLE events', (err) => {
          if (err) console.error('Drop old table error:', err.message);
        });
        
        // Rename new table
        db.run('ALTER TABLE events_new RENAME TO events', (err) => {
          if (err) console.error('Rename table error:', err.message);
        });
        
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Migration failed:', err.message);
            db.run('ROLLBACK');
          } else {
            console.log('✅ Events table migrated successfully');
          }
        });
      });
    } else {
      console.log('✅ Events table already has correct schema');
    }
  });
}

// Promisified database methods
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export default db;