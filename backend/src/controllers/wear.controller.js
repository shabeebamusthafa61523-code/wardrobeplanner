const WearRecord = require('../models/WearRecord');
const Outfit = require('../models/Outfit');
const WardrobeItem = require('../models/WardrobeItem');
const repeatService = require('../services/repeatDetection.service');

// Record wearing items today (or specific date)
const recordWear = async (req, res) => {
  try {
    const userId = req.userId || 'default-user';
    const { itemIds, date, override, source, notes, imageUrl } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one wardrobe item must be selected' });
    }

    const wornDate = date || new Date().toISOString().split('T')[0];

    // 1. Check for Duplicate Same-Day Wear Logic
    const existingSameDayRecords = await WearRecord.find({
      userId,
      wornDate,
      wardrobeItemId: { $in: itemIds },
    }).populate('wardrobeItemId');

    if (existingSameDayRecords.length > 0 && !override) {
      const itemNames = existingSameDayRecords.map((r) => r.wardrobeItemId.name).join(', ');
      return res.status(409).json({
        success: false,
        isSameDayDuplicate: true,
        message: `This item is already marked as worn today (${itemNames}).`,
      });
    }

    // 2. Check for Recent Repeat Warnings (Item & Outfit level) unless override is set
    if (!override) {
      const outfitRepeat = await repeatService.isSameOutfitRecentlyWorn(itemIds, userId, wornDate);
      if (outfitRepeat.isRecent) {
        return res.status(200).json({
          success: false,
          requiresConfirmation: true,
          type: 'outfit_repeat',
          daysAgo: outfitRepeat.daysAgo,
          message: `⚠️ You wore this exact outfit ${outfitRepeat.daysAgo === 0 ? 'today' : `${outfitRepeat.daysAgo} days ago`}.`,
        });
      }

      // Check item-level repeat warnings
      const itemWarnings = [];
      for (const id of itemIds) {
        const item = await WardrobeItem.findById(id);
        const itemRepeat = await repeatService.isRecentlyWorn(id, userId, wornDate);
        if (itemRepeat.isRecent && itemRepeat.daysAgo > 0) {
          itemWarnings.push({
            itemName: item ? item.name : 'Item',
            daysAgo: itemRepeat.daysAgo,
          });
        }
      }

      if (itemWarnings.length > 0) {
        const firstWarn = itemWarnings[0];
        return res.status(200).json({
          success: false,
          requiresConfirmation: true,
          type: 'item_repeat',
          daysAgo: firstWarn.daysAgo,
          message: `⚠️ ${firstWarn.itemName} was worn ${firstWarn.daysAgo} days ago.`,
          warnings: itemWarnings,
        });
      }
    }

    // 3. Create Outfit Record
    const outfit = await Outfit.create({
      userId,
      date: wornDate,
      itemIds,
      source: source || 'manual',
      imageUrl: imageUrl || null,
      notes: notes || '',
    });

    // 4. Create Individual WearRecords & update item wear stats
    for (const itemId of itemIds) {
      // Remove existing record for same day if override/editing
      await WearRecord.deleteMany({ userId, wardrobeItemId: itemId, wornDate });

      await WearRecord.create({
        userId,
        wardrobeItemId: itemId,
        outfitId: outfit._id,
        wornDate,
      });

      // Update total wear count and last worn timestamp
      const totalWears = await WearRecord.countDocuments({ wardrobeItemId: itemId, userId });
      await WardrobeItem.findByIdAndUpdate(itemId, {
        wearCount: totalWears,
        lastWornAt: new Date(wornDate),
      });
    }

    const populatedOutfit = await Outfit.findById(outfit._id).populate('itemIds');

    res.status(201).json({
      success: true,
      message: '✓ Today\'s outfit saved.',
      data: populatedOutfit,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get wearing history (list of past outfits & records)
const getWearHistory = async (req, res) => {
  try {
    const userId = req.userId || 'default-user';
    const { itemId, category, date } = req.query;

    const query = { userId, plannerDay: { $in: [null, undefined] } };

    if (date) {
      query.date = date;
    }

    let outfits = await Outfit.find(query).populate('itemIds').sort({ date: -1 }).lean();

    // Filter by item or category if specified
    if (itemId) {
      outfits = outfits.filter((o) =>
        o.itemIds.some((i) => i._id.toString() === itemId)
      );
    }

    if (category && category !== 'All') {
      outfits = outfits.filter((o) =>
        o.itemIds.some((i) => i.category.toLowerCase() === category.toLowerCase())
      );
    }

    res.json({
      success: true,
      count: outfits.length,
      data: outfits,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get wear records for a specific item
const getItemWearHistory = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.userId || 'default-user';

    const records = await WearRecord.find({ wardrobeItemId: itemId, userId })
      .sort({ wornDate: -1 })
      .lean();

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get today's outfits (all records for today)
const getTodayOutfit = async (req, res) => {
  try {
    const userId = req.userId || 'default-user';
    const todayStr = new Date().toISOString().split('T')[0];

    const todayOutfits = await Outfit.find({
      userId,
      date: todayStr,
      plannerDay: { $in: [null, undefined] },
    })
      .populate('itemIds')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      hasRecordedToday: todayOutfits.length > 0,
      data: todayOutfits,          // array (may be empty)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete today's outfit record
const deleteTodayOutfit = async (req, res) => {
  try {
    const userId = req.userId || 'default-user';
    const todayStr = new Date().toISOString().split('T')[0];

    await Outfit.deleteMany({
      userId,
      date: todayStr,
      plannerDay: { $in: [null, undefined] },
    });
    await WearRecord.deleteMany({ userId, wornDate: todayStr });

    res.json({ success: true, message: "✓ Today's outfit record removed." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  recordWear,
  getWearHistory,
  getItemWearHistory,
  getTodayOutfit,
  deleteTodayOutfit,
};
