const mongoose = require('mongoose');

const SavedComboSchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'default-user' },
    name: { type: String, required: true },
    itemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WardrobeItem', required: true }],
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SavedCombo', SavedComboSchema);
