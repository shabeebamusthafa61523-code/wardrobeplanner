require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Outfit = require('../src/models/Outfit');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wardrobedetect');
  const res = await Outfit.updateMany(
    { plannerDay: { $ne: null } },
    { $set: { date: null } }
  );
  console.log('Done! Updated planned outfits count:', res.modifiedCount || 0);
  process.exit(0);
}
fix().catch((e) => { console.error(e); process.exit(1); });
