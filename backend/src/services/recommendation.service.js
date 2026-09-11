const WardrobeItem = require('../models/WardrobeItem');
const repeatService = require('./repeatDetection.service');

/**
 * Basic rule-based recommendation generator
 */
const getRecommendedItems = async (userId = 'default-user') => {
  const allItems = await WardrobeItem.find({ userId }).lean();
  if (allItems.length === 0) return null;

  const windowDays = repeatService.getRepeatWindowDays();
  const today = new Date();

  // Categorize items
  const tops = allItems.filter((i) =>
    ['kurti', 'shirt', 'top', 't-shirt', 'blouse'].includes(i.category.toLowerCase())
  );
  const bottoms = allItems.filter((i) =>
    ['pants', 'jeans', 'trousers', 'skirt', 'palazzo'].includes(i.category.toLowerCase())
  );
  const onePieces = allItems.filter((i) =>
    ['dress', 'saree', 'jumpsuit'].includes(i.category.toLowerCase())
  );

  // Score items by: last worn (older = higher score) and lower wear count
  const scoreItem = (item) => {
    let score = 0;
    if (!item.lastWornAt) {
      score += 100; // Never worn gets top priority
    } else {
      const daysSince = Math.floor((today - new Date(item.lastWornAt)) / (1000 * 60 * 60 * 24));
      if (daysSince > windowDays) {
        score += 50 + Math.min(daysSince, 30);
      } else {
        score -= (windowDays - daysSince) * 10;
      }
    }
    score -= (item.wearCount || 0) * 2;
    return score;
  };

  const sortedTops = [...tops].sort((a, b) => scoreItem(b) - scoreItem(a));
  const sortedBottoms = [...bottoms].sort((a, b) => scoreItem(b) - scoreItem(a));
  const sortedOnePieces = [...onePieces].sort((a, b) => scoreItem(b) - scoreItem(a));

  let recommendedCombo = [];
  let reason = '';

  if (sortedTops.length > 0 && sortedBottoms.length > 0) {
    const bestTop = sortedTops[0];
    const bestBottom = sortedBottoms[0];
    recommendedCombo = [bestTop, bestBottom];

    const topDays = bestTop.lastWornAt
      ? Math.floor((today - new Date(bestTop.lastWornAt)) / (1000 * 60 * 60 * 24))
      : null;
    reason = topDays === null
      ? `${bestTop.name} has never been worn yet!`
      : `${bestTop.name} was last worn ${topDays} days ago. Great fresh combination!`;
  } else if (sortedOnePieces.length > 0) {
    const bestPiece = sortedOnePieces[0];
    recommendedCombo = [bestPiece];
    reason = `${bestPiece.name} hasn't been worn recently.`;
  } else if (allItems.length > 0) {
    const bestAny = [...allItems].sort((a, b) => scoreItem(b) - scoreItem(a))[0];
    recommendedCombo = [bestAny];
    reason = `Recommended based on low wear frequency.`;
  }

  return {
    items: recommendedCombo,
    reason,
  };
};

module.exports = {
  getRecommendedItems,
};
