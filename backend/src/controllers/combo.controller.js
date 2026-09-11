const SavedCombo = require('../models/SavedCombo');

const getSavedCombos = async (req, res) => {
  try {
    const userId = req.userId || 'default-user';
    const combos = await SavedCombo.find({ userId }).populate('itemIds').sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: combos.length, data: combos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const createSavedCombo = async (req, res) => {
  try {
    const userId = req.userId || 'default-user';
    const { name, itemIds, notes } = req.body;

    if (!name || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Combo name and items are required' });
    }

    const newCombo = await SavedCombo.create({
      userId,
      name,
      itemIds,
      notes: notes || '',
    });

    const populated = await SavedCombo.findById(newCombo._id).populate('itemIds');
    res.status(201).json({
      success: true,
      message: `✓ Saved combo "${name}" created!`,
      data: populated,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteSavedCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const combo = await SavedCombo.findByIdAndDelete(id);
    if (!combo) {
      return res.status(404).json({ success: false, error: 'Saved combo not found' });
    }
    res.json({ success: true, message: 'Saved combo removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getSavedCombos,
  createSavedCombo,
  deleteSavedCombo,
};
