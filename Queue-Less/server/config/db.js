const mongoose = require('mongoose');
const { MONGODB_URI } = require('./constants');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Error] Connection failed: ${error.message}`);
    // Non-fatal logging to keep server alive if DB is offline initially
  }
};

module.exports = connectDB;
