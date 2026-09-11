const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../src/models/User');

const targetName = (process.argv[2] || '').toLowerCase().trim();
if (!targetName) { console.error('Usage: node scripts/make-superadmin.js <username>'); process.exit(1); }

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wardrobedetect');
  const user = await User.findOneAndUpdate({ name: targetName }, { role: 'superadmin' }, { new: true }).select('-password');
  if (!user) { console.error('No user found: ' + targetName); process.exit(1); }
  console.log('OK: ' + user.name + ' is now superadmin.');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
