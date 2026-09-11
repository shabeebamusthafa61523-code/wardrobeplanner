const mongoose = require('mongoose');

const WearRecordSchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'default-user' },
    wardrobeItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'WardrobeItem', required: true },
    outfitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outfit', required: true },
    wornDate: { type: String, required: true }, // Format: YYYY-MM-DD
  },
  { timestamps: true }
);

module.exports = mongoose.model('WearRecord', WearRecordSchema);
