// filepath: c:\Users\Mohit\Desktop\mindbloom\backend\config\mysql.js
require("dotenv").config();
const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");

// Initialize Sequelize instance
const sequelize = new Sequelize(
  process.env.MYSQL_DB,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
  }
);

async function initializeDatabase() {
  // Create a connection to MySQL without specifying a database
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  });

  // Create the database if it doesn't exist
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DB}`
  );
  await connection.end();

  // Test the connection
  await sequelize.authenticate();
  console.log("MySQL connection has been established successfully.");
}

// Export both the initialize function and the sequelize instance
module.exports = { initializeDatabase, sequelize };
