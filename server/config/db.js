const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medical_portal';
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI not set. Falling back to mongodb://127.0.0.1:27017/medical_portal');
  }
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
}

module.exports = connectDB;
