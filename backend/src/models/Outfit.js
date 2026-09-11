const mongoose = require('mongoose');

const OutfitSchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'default-user' },
    date: { type: String, default: null }, // Format: YYYY-MM-DD (null for weekly planned outfits)
    itemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WardrobeItem', required: true }],
    imageUrl: { type: String, default: null },
    source: { type: String, enum: ['manual', 'ai'], default: 'manual' },
    notes: { type: String, default: '' },
    plannerDay: { type: String, default: null }, // e.g., 'Monday', 'Tuesday', or null if recorded daily outfit
  },
  { timestamps: true }
);

module.exports = mongoose.model('Outfit', OutfitSchema);
