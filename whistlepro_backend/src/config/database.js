const knex = require('knex');
const config = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

const db = knex(dbConfig);

// Test database connection
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Database connection established successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
  });

module.exports = db;