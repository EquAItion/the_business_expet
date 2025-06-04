const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function updateSchema() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'rohitdogra@23',
      database: 'expertise_station',
      multipleStatements: true // Allow multiple statements
    });

    console.log('Connected to database');

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');

    // Execute schema updates
    await connection.query(schema);
    console.log('Database schema updated successfully');

  } catch (error) {
    console.error('Error updating schema:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the update if this file is executed directly
if (require.main === module) {
  updateSchema()
    .then(() => {
      console.log('Schema update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Schema update failed:', error);
      process.exit(1);
    });
}

module.exports = updateSchema; 