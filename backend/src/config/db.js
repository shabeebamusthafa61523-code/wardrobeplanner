const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wardrobedetect';

    if (mongoUri.includes('<db_password>')) {
      console.warn('[MongoDB Notice]: Placeholder <db_password> detected in MONGODB_URI.');
      console.warn('[MongoDB Notice]: Attempting local connection at mongodb://127.0.0.1:27017/wardrobedetect');
      mongoUri = 'mongodb://127.0.0.1:27017/wardrobedetect';
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB Connected]: Host -> ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Warning]: Connection failed (${error.message}). API endpoints will run, but database features require MongoDB.`);
  }
};

module.exports = connectDB;
