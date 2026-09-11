const WardrobeItem = require("../models/WardrobeItem");
const { visuallyMatchItemsInOutfit } = require("./ai.service");

/**
 * Match AI detected items against user wardrobe.
 * When Gemini key is present: uses VISUAL comparison (image vs image).
 * When no key: falls back to category+color text scoring.
 */
const matchAIDetectedItemsWithWardrobe = async (detectedItems, userId = "default-user", outfitImagePath = null) => {
  const userWardrobe = await WardrobeItem.find({ userId }).lean();
  if (userWardrobe.length === 0) return [];

  // ── VISUAL MATCHING (Gemini key present + outfit image available) ──────────
  if (outfitImagePath && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    try {
      console.log("[Matcher]: Using Gemini visual matching against", userWardrobe.length, "wardrobe items...");
      const visualScores = await visuallyMatchItemsInOutfit(outfitImagePath, userWardrobe);

      if (visualScores) {
        // Build results: items Gemini says are present → show as matched
        const presentItems = userWardrobe
          .map((item) => ({ item, score: visualScores[item._id] || { present: false, confidence: 0 } }))
          .filter((x) => x.score.present && x.score.confidence >= 0.5)
          .sort((a, b) => b.score.confidence - a.score.confidence);

        if (presentItems.length > 0) {
          // Return one result entry per visually confirmed item
          return presentItems.map(({ item, score }) => ({
            detectedCategory: item.category,
            detectedColor: item.color,
            aiConfidence: score.confidence,
            visualMatch: true,
            reason: score.reason,
            matchedItem: {
              ...item,
              matchConfidence: Math.round(score.confidence * 100),
            },
            candidates: [],
          }));
        }

        console.log("[Matcher]: Visual match found no confident hits, falling back to text match.");
      }
    } catch (err) {
      console.warn("[Matcher]: Visual matching error, falling back to text match:", err.message);
    }
  }

  // ── TEXT / HEURISTIC MATCHING (fallback) ──────────────────────────────────
  console.log("[Matcher]: Using text/category+color heuristic matching.");
  const matchedResults = [];

  for (const detected of detectedItems) {
    const targetCat = (detected.category || "").toLowerCase().trim();
    const targetColor = (detected.color || "").toLowerCase().trim();

    const scoredCandidates = userWardrobe.map((item) => {
      const itemCat = (item.category || "").toLowerCase().trim();
      const itemColor = (item.color || "").toLowerCase().trim();
      let score = 0;

      // Category match
      if (itemCat === targetCat) {
        score += 50;
      } else if (
        (itemCat.includes("top") || itemCat.includes("shirt") || itemCat.includes("kurti")) &&
        (targetCat.includes("top") || targetCat.includes("shirt") || targetCat.includes("kurti"))
      ) {
        score += 30;
      } else if (
        (itemCat.includes("pants") || itemCat.includes("jeans") || itemCat.includes("trousers")) &&
        (targetCat.includes("pants") || targetCat.includes("jeans") || targetCat.includes("trousers"))
      ) {
        score += 30;
      }

      // Color match
      if (itemColor === targetColor) {
        score += 45;
      } else if (itemColor.includes(targetColor) || targetColor.includes(itemColor)) {
        score += 35;
      }

      const overallConfidence = Math.min(
        Math.round((score / 95) * (detected.confidence || 0.9) * 100),
        98
      );

      return { item, score, matchConfidence: Math.max(overallConfidence, 40) };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);

    const bestMatch = scoredCandidates[0] && scoredCandidates[0].score > 25 ? scoredCandidates[0] : null;
    const alternativeMatches = scoredCandidates
      .slice(0, 4)
      .filter((c) => c.score > 15)
      .map((c) => ({ ...c.item, matchConfidence: c.matchConfidence }));

    matchedResults.push({
      detectedCategory: detected.category,
      detectedColor: detected.color,
      aiConfidence: detected.confidence,
      visualMatch: false,
      matchedItem: bestMatch ? { ...bestMatch.item, matchConfidence: bestMatch.matchConfidence } : null,
      candidates: alternativeMatches,
    });
  }

  return matchedResults;
};

module.exports = { matchAIDetectedItemsWithWardrobe };
