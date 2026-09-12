const WardrobeItem = require('../models/WardrobeItem');
const WearRecord = require('../models/WearRecord');
const repeatService = require('../services/repeatDetection.service');
const { uploadToCloudinary } = require('../config/cloudinary');

// Get all wardrobe items with filtering & wear data
const getWardrobeItems = async (req, res) => {
  try {
    const { category, search } = req.query;
    const userId = req.userId || 'default-user';

    const query = { userId };

    if (category && category !== 'All') {
      query.category = category.toLowerCase();
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { color: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await WardrobeItem.find(query).sort({ createdAt: -1 }).lean();

    // Attach repeat status info to each item
    const itemsWithRepeatInfo = await Promise.all(
      items.map(async (item) => {
        const recentInfo = await repeatService.isRecentlyWorn(item._id, userId);
        return {
          ...item,
          isRecentlyWorn: recentInfo.isRecent,
          daysSinceLastWorn: recentInfo.daysAgo,
        };
      })
    );

    res.json({ success: true, count: itemsWithRepeatInfo.length, data: itemsWithRepeatInfo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get single wardrobe item details + wear history log
const getWardrobeItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || 'default-user';

    const item = await WardrobeItem.findById(id).lean();
    if (!item) {
      return res.status(404).json({ success: false, error: 'Clothing item not found' });
    }

    // Fetch wear history dates
    const wearRecords = await WearRecord.find({ wardrobeItemId: id, userId })
      .sort({ wornDate: -1 })
      .lean();

    const recentInfo = await repeatService.isRecentlyWorn(id, userId);

    res.json({
      success: true,
      data: {
        ...item,
        isRecentlyWorn: recentInfo.isRecent,
        daysSinceLastWorn: recentInfo.daysAgo,
        wearHistory: wearRecords.map((r) => r.wornDate),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Create new wardrobe item
const createWardrobeItem = async (req, res) => {
  try {
    const userId = req.userId || 'default-user';
    const { name, category, color, pattern, season, notes } = req.body;

    if (!req.file && !req.body.imageUrl) {
      return res.status(400).json({ success: false, error: 'Clothing photo is required' });
    }

    let imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || '');

    if (req.file) {
      const cloudRes = await uploadToCloudinary(req.file.path, 'wardrobe_items');
      if (cloudRes && cloudRes.secure_url) {
        imageUrl = cloudRes.secure_url;
      }
    }

    const defaultName = name && name.trim() ? name.trim() : `Clothing Item #${Math.floor(100 + Math.random() * 900)}`;

    const newItem = await WardrobeItem.create({
      userId,
      name: defaultName,
      category: (category || 'other').toLowerCase().trim(),
      color: (color || 'custom').toLowerCase().trim(),
      pattern: pattern || 'Solid',
      season: season || 'All Season',
      notes: notes || '',
      imageUrl,
    });

    res.status(201).json({
      success: true,
      message: `Clothing photo added to your wardrobe.`,
      data: newItem,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update wardrobe item
const updateWardrobeItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    if (req.file) {
      updateFields.imageUrl = `/uploads/${req.file.filename}`;
      const cloudRes = await uploadToCloudinary(req.file.path, 'wardrobe_items');
      if (cloudRes && cloudRes.secure_url) {
        updateFields.imageUrl = cloudRes.secure_url;
      }
    }

    if (updateFields.category) {
      updateFields.category = updateFields.category.toLowerCase().trim();
    }
    if (updateFields.color) {
      updateFields.color = updateFields.color.toLowerCase().trim();
    }

    const item = await WardrobeItem.findByIdAndUpdate(id, updateFields, { new: true });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Clothing item not found' });
    }

    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete wardrobe item
const deleteWardrobeItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await WardrobeItem.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Clothing item not found' });
    }
    // Delete associated wear records
    await WearRecord.deleteMany({ wardrobeItemId: id });

    res.json({ success: true, message: 'Item removed from wardrobe' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getWardrobeItems,
  getWardrobeItemById,
  createWardrobeItem,
  updateWardrobeItem,
  deleteWardrobeItem,
};
