const Outfit = require('../models/Outfit');

const getOutfits = async (req, res) => {
  try {
    const userId = req.userId || 'default-user';
    const outfits = await Outfit.find({ userId }).populate('itemIds').sort({ date: -1 }).lean();
    res.json({ success: true, count: outfits.length, data: outfits });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getOutfitById = async (req, res) => {
  try {
    const { id } = req.params;
    const outfit = await Outfit.findById(id).populate('itemIds').lean();
    if (!outfit) {
      return res.status(404).json({ success: false, error: 'Outfit not found' });
    }
    res.json({ success: true, data: outfit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const createOutfit = async (req, res) => {
  try {
    const userId = req.userId || 'default-user';
    const { date, itemIds, imageUrl, source, notes, plannerDay } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Item IDs array is required' });
    }

    const newOutfit = await Outfit.create({
      userId,
      date: date || new Date().toISOString().split('T')[0],
      itemIds,
      imageUrl: imageUrl || null,
      source: source || 'manual',
      notes: notes || '',
      plannerDay: plannerDay || null,
    });

    const populated = await Outfit.findById(newOutfit._id).populate('itemIds');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const updateOutfit = async (req, res) => {
  try {
    const { id } = req.params;
    const outfit = await Outfit.findByIdAndUpdate(id, req.body, { new: true }).populate('itemIds');
    if (!outfit) {
      return res.status(404).json({ success: false, error: 'Outfit not found' });
    }
    res.json({ success: true, data: outfit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const deleteOutfit = async (req, res) => {
  try {
    const { id } = req.params;
    const outfit = await Outfit.findByIdAndDelete(id);
    if (!outfit) {
      return res.status(404).json({ success: false, error: 'Outfit not found' });
    }
    res.json({ success: true, message: 'Outfit removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getOutfits,
  getOutfitById,
  createOutfit,
  updateOutfit,
  deleteOutfit,
};
