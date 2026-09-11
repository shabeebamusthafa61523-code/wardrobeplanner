const aiService = require('../services/ai.service');
const wardrobeMatcher = require('../services/wardrobeMatcher.service');
const recommendationService = require('../services/recommendation.service');
const repeatService = require('../services/repeatDetection.service');

// Scan today's outfit image and match against user wardrobe
const scanOutfit = async (req, res) => {
  try {
    const userId = req.userId || 'default-user';

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Outfit image file is required' });
    }

    const imagePath = req.file.path;
    const imageUrl = `/uploads/${req.file.filename}`;

    // 1. Describe outfit using Gemini vision (what categories/colors are visible)
    const aiAnalysis = await aiService.analyzeOutfitImage(imagePath);

    // 2. Match against wardrobe — pass imagePath so visual matching can compare images directly
    const matchResults = await wardrobeMatcher.matchAIDetectedItemsWithWardrobe(
      aiAnalysis.items || [],
      userId,
      imagePath  // ← enables Gemini visual item comparison
    );

    res.json({
      success: true,
      imageUrl,
      isFallback: aiAnalysis.isFallback,
      message: aiAnalysis.message,
      detectedItems: aiAnalysis.items,
      matches: matchResults,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'We couldn\'t identify your outfit automatically.',
      details: err.message,
    });
  }
};

// Get smart outfit recommendation
const getRecommendation = async (req, res) => {
  try {
    const userId = req.userId || 'default-user';
    const recommendation = await recommendationService.getRecommendedItems(userId);
    const warnings = await repeatService.getRepeatWarnings(userId);

    res.json({
      success: true,
      recommendation,
      warnings,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  scanOutfit,
  getRecommendation,
};
