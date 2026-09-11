const Outfit = require('../models/Outfit');
const repeatService = require('../services/repeatDetection.service');

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Get current weekly planner schedule (indexed by exact date YYYY-MM-DD)
const getWeeklyPlanner = async (req, res) => {
  try {
    const userId = req.userId || 'default-user';

    // Find all planned outfits for user
    const plannedOutfits = await Outfit.find({
      userId,
      plannerDay: { $ne: null },
    })
      .populate('itemIds')
      .lean();

    const plannerMap = {};

    for (const outfit of plannedOutfits) {
      const itemIds = outfit.itemIds.map((i) => i._id);
      const outfitRepeat = await repeatService.isSameOutfitRecentlyWorn(itemIds, userId);

      const outfitData = {
        ...outfit,
        hasRepeatWarning: outfitRepeat.isRecent,
        warningMessage: outfitRepeat.isRecent
          ? `⚠️ Exact outfit worn ${outfitRepeat.daysAgo} days ago`
          : null,
      };

      // Map by exact date YYYY-MM-DD if available, or by day name as fallback
      if (outfit.date) {
        plannerMap[outfit.date] = outfitData;
      } else if (outfit.plannerDay) {
        plannerMap[outfit.plannerDay] = outfitData;
      }
    }

    res.json({ success: true, data: plannerMap });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Set or update outfit for a specific date
const setPlannerDayOutfit = async (req, res) => {
  try {
    const userId = req.userId || 'default-user';
    const { day, date, itemIds, notes } = req.body;

    if (!day || !daysOfWeek.includes(day)) {
      return res.status(400).json({ success: false, error: 'Valid planner day is required (Monday-Saturday)' });
    }

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one item must be selected' });
    }

    // Delete existing planned outfit for this exact date (or day if no date provided)
    if (date) {
      await Outfit.deleteMany({ userId, date, plannerDay: { $ne: null } });
    } else {
      await Outfit.deleteMany({ userId, plannerDay: day });
    }

    const plannedOutfit = await Outfit.create({
      userId,
      date: date || null,
      plannerDay: day,
      itemIds,
      source: 'manual',
      notes: notes || '',
    });

    const populated = await Outfit.findById(plannedOutfit._id).populate('itemIds');

    res.json({
      success: true,
      message: `✓ Planned outfit saved for ${day}${date ? ` (${date})` : ''}.`,
      data: populated,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete outfit from a planner date or day
const removePlannerDayOutfit = async (req, res) => {
  try {
    const userId = req.userId || 'default-user';
    const { day } = req.params;

    await Outfit.deleteMany({
      userId,
      $or: [{ date: day }, { plannerDay: day }],
    });

    res.json({ success: true, message: `Outfit cleared for ${day}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getWeeklyPlanner,
  setPlannerDayOutfit,
  removePlannerDayOutfit,
};
