const WearRecord = require('../models/WearRecord');
const WardrobeItem = require('../models/WardrobeItem');
const Outfit = require('../models/Outfit');

const getRepeatWindowDays = () => {
  return parseInt(process.env.RECENT_REPEAT_DAYS || '7', 10);
};

// Helper: Calculate difference in days between two date strings (YYYY-MM-DD) or objects
const getDaysDifference = (dateString1, dateString2 = new Date()) => {
  const d1 = new Date(dateString1);
  const d2 = new Date(dateString2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(d2 - d1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get last worn date for a specific item
 */
const getLastWornDate = async (itemId, userId = 'default-user') => {
  const latestRecord = await WearRecord.findOne({ wardrobeItemId: itemId, userId })
    .sort({ wornDate: -1 })
    .lean();
  return latestRecord ? latestRecord.wornDate : null;
};

/**
 * Get total wear count for a specific item
 */
const getWearCount = async (itemId, userId = 'default-user') => {
  return await WearRecord.countDocuments({ wardrobeItemId: itemId, userId });
};

/**
 * Check if item was worn within recent repeat days
 */
const isRecentlyWorn = async (itemId, userId = 'default-user', targetDate = new Date()) => {
  const lastWornDate = await getLastWornDate(itemId, userId);
  if (!lastWornDate) return { isRecent: false, daysAgo: null };

  const daysAgo = getDaysDifference(lastWornDate, targetDate);
  const windowDays = getRepeatWindowDays();

  return {
    isRecent: daysAgo <= windowDays,
    daysAgo,
    lastWornDate,
  };
};

/**
 * Check if exact outfit combination was worn recently
 */
const isSameOutfitRecentlyWorn = async (itemIds, userId = 'default-user', targetDate = new Date()) => {
  if (!itemIds || itemIds.length === 0) return { isRecent: false, lastWornDate: null, daysAgo: null };

  const sortedTarget = [...itemIds].map((id) => id.toString()).sort();

  // Find all outfits for user sorted by date descending
  const recentOutfits = await Outfit.find({ userId }).sort({ date: -1 }).lean();
  const windowDays = getRepeatWindowDays();

  for (const outfit of recentOutfits) {
    const outfitItemIds = outfit.itemIds.map((id) => id.toString()).sort();
    
    // Check if item arrays are identical
    if (
      outfitItemIds.length === sortedTarget.length &&
      outfitItemIds.every((val, index) => val === sortedTarget[index])
    ) {
      const daysAgo = getDaysDifference(outfit.date, targetDate);
      if (daysAgo <= windowDays) {
        return {
          isRecent: true,
          lastWornDate: outfit.date,
          daysAgo,
          outfitId: outfit._id,
        };
      }
    }
  }

  return { isRecent: false, lastWornDate: null, daysAgo: null };
};

/**
 * Get repeat warnings for recently worn items / outfits
 */
const getRepeatWarnings = async (userId = 'default-user') => {
  const windowDays = getRepeatWindowDays();
  const todayStr = new Date().toISOString().split('T')[0];

  const recentRecords = await WearRecord.find({ userId })
    .populate('wardrobeItemId')
    .sort({ wornDate: -1 })
    .lean();

  const warnings = [];
  const processedItems = new Set();

  for (const record of recentRecords) {
    if (!record.wardrobeItemId) continue;
    const itemId = record.wardrobeItemId._id.toString();
    if (processedItems.has(itemId)) continue;
    processedItems.add(itemId);

    const daysAgo = getDaysDifference(record.wornDate, todayStr);
    if (daysAgo <= windowDays && daysAgo >= 0) {
      warnings.push({
        type: 'item_repeat',
        itemId: record.wardrobeItemId._id,
        itemName: record.wardrobeItemId.name,
        daysAgo,
        wornDate: record.wornDate,
        message: `${record.wardrobeItemId.name} was worn ${daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`}.`,
      });
    }
  }

  return warnings;
};

module.exports = {
  getRepeatWindowDays,
  getLastWornDate,
  getWearCount,
  isRecentlyWorn,
  isSameOutfitRecentlyWorn,
  getRepeatWarnings,
};
