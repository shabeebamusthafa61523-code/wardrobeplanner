const mongoose = require('mongoose');

const WardrobeItemSchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'default-user' },
    name: { type: String, default: 'Clothing Item' },
    imageUrl: { type: String, required: true },
    category: {
      type: String,
      default: 'other',
      trim: true,
      lowercase: true,
    },
    color: { type: String, default: 'custom', lowercase: true },
    pattern: { type: String, default: 'Solid' },
    season: { type: String, default: 'All Season' },
    notes: { type: String, default: '' },
    wearCount: { type: Number, default: 0 },
    lastWornAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WardrobeItem', WardrobeItemSchema);
