const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

console.log('Testing connection to:', process.env.DATABASE_URL.split('@')[1]);

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Connection error:', err.message);
    } else {
        console.log('Connection successful:', res.rows[0]);
    }
    pool.end();
});
