const { Pool } = require('pg');
require('dotenv').config();



const pool = new Pool({
    host: 'ep-dark-recipe-a5qgolhl.us-east-2.aws.neon.tech',
    database: 'clonedb',
    user: 'clonedb_owner',
    password: 'q3ZycpUEK9NT',
    port: 5432,
    ssl: {
      rejectUnauthorized: false
    }
  });

const createTables = async () => {
    const createSessionsTableQuery = `
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    const createMessagesTableQuery = `
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            session_id INTEGER,
            role VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
        )
    `;

    try {
        await pool.query(createSessionsTableQuery);
        console.log('Chat sessions table created or already exists');
        await pool.query(createMessagesTableQuery);
        console.log('Messages table created or already exists');
    } catch (err) {
        console.error('Error creating tables:', err);
    }
};

createTables();

module.exports = pool;
