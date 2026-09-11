const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['user', 'superadmin'], default: 'user' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
