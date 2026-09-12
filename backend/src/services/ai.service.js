const fs = require("fs");
const path = require("path");

/**
 * AI Service — Outfit Image Analysis + Visual Wardrobe Matching
 * Uses Gemini Vision when GEMINI_API_KEY is set.
 */

// ─── Step 1: Analyze outfit image and extract clothing descriptors ──────────
const analyzeOutfitImage = async (filePath) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim()) {
    try {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString("base64");
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

      const prompt = `Analyze this outfit photo for detailed wardrobe tracking. Identify all clothing items visible (tops, bottomwear, dresses, kurtis, shirts, pants, skirts, sarees, jackets, scarves, dupattas, etc.).

For EACH clothing item found, analyze:
1. "category": (string, e.g., "kurti", "shirt", "top", "pants", "jeans", "skirt", "dress", "saree", "scarf", "dupatta", "jacket", "hoodie")
2. "color": (string, primary color e.g., "navy blue", "dark green", "black", "white", "pink", "maroon", "yellow", "beige", "cream", "red", "grey")
3. "pattern": (string, e.g., "Floral", "Solid", "Striped", "Checked", "Printed", "Polka Dot", "Embroidered", "Geometric", "Abstract", "Paisley")
4. "print": (string, brief visual description of prints/motifs, e.g. "small pink floral print", "gold embroidery at neck", "white vertical stripes")
5. "confidence": (number between 0.60 and 0.99)

Return ONLY a raw JSON object with key "items":
{
  "items": [
    { "category": "kurti", "color": "blue", "pattern": "Floral", "print": "pink and white floral motifs", "confidence": 0.96 },
    { "category": "pants", "color": "black", "pattern": "Solid", "print": "solid black", "confidence": 0.93 }
  ]
}`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType } },
      ]);

      const text = (await result.response.text()) || "";
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed && Array.isArray(parsed.items)) {
        return { items: parsed.items, isFallback: false };
      }
    } catch (err) {
      console.warn("[AI Service]: Gemini analysis failed, using text fallback:", err.message);
    }
  }

  console.log("[AI Service]: No API key or Gemini failed — using heuristic fallback.");
  return getMockAIScanResult(filePath);
};

// Helper to load image buffer from either HTTP/Cloudinary URL or local file path
const getItemImageBuffer = async (imageUrl) => {
  if (!imageUrl) return null;
  try {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const resp = await fetch(imageUrl);
      if (!resp.ok) return null;
      const arrayBuf = await resp.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuf),
        mimeType: imageUrl.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg',
      };
    }
    const relPath = imageUrl.replace(/^\//, '');
    const localPath = path.join(__dirname, '../../..', 'uploads', path.basename(relPath));
    if (fs.existsSync(localPath)) {
      const ext = path.extname(localPath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      return {
        buffer: fs.readFileSync(localPath),
        mimeType,
      };
    }
  } catch (err) {
    console.warn('[AI Service]: Error fetching item image for visual match:', err.message);
  }
  return null;
};

// ─── Step 2: Visual match — compare outfit photo vs each wardrobe item image ─
/**
 * Given the outfit photo path and an array of wardrobe items (each with imageUrl),
 * asks Gemini to check whether each wardrobe item is visually present in the outfit.
 * Returns a score map: { itemId -> { present: bool, confidence: float, reason: string } }
 */
const visuallyMatchItemsInOutfit = async (outfitImagePath, wardrobeItems) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null; // No key — caller falls back to text matching

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Read outfit image once
  const outfitBuffer = fs.readFileSync(outfitImagePath);
  const outfitBase64 = outfitBuffer.toString('base64');
  const outfitExt = path.extname(outfitImagePath).toLowerCase();
  const outfitMime = outfitExt === '.png' ? 'image/png' : outfitExt === '.webp' ? 'image/webp' : 'image/jpeg';

  const results = {};

  // Check each wardrobe item visually (parallel, up to 6 at once to avoid rate limits)
  const BATCH_SIZE = 6;
  for (let i = 0; i < wardrobeItems.length; i += BATCH_SIZE) {
    const batch = wardrobeItems.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (item) => {
        try {
          const itemImg = await getItemImageBuffer(item.imageUrl);

          if (!itemImg || !itemImg.buffer) {
            results[item._id] = { present: false, confidence: 0, reason: 'Wardrobe item image unavailable' };
            return;
          }

          const itemBase64 = itemImg.buffer.toString('base64');

          const prompt = `You are a high-precision clothing visual matching AI.
Image 1: Photo of an outfit being worn today.
Image 2: Saved wardrobe item named "${item.name || 'Clothing Item'}" (Category: ${item.category}, Color: ${item.color || 'unknown'}, Pattern: ${item.pattern || 'any'}).

Carefully compare Image 1 and Image 2:
1. Color Match: Compare color hue, shade, and tones.
2. Pattern & Print Match: Compare fabric patterns (floral, stripes, checks, solid, embroidery, polka dot, etc.).
3. Garment Style: Compare cut, neckline, sleeves, and silhouette.

Is the item in Image 2 (or a visually identical clothing piece) worn in Image 1?

Return ONLY a raw JSON object (no markdown):
{
  "present": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "Detailed visual match rationale comparing color, pattern, and design"
}`;

          const result = await model.generateContent([
            prompt,
            { inlineData: { data: outfitBase64, mimeType: outfitMime } },
            { inlineData: { data: itemBase64, mimeType: itemImg.mimeType } },
          ]);

          const text = (await result.response.text()) || '';
          const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          results[item._id] = {
            present: !!parsed.present,
            confidence: parseFloat(parsed.confidence) || 0,
            reason: parsed.reason || '',
          };
        } catch (err) {
          console.warn(`[Visual Match]: Failed for item ${item._id}:`, err.message);
          results[item._id] = { present: false, confidence: 0, reason: 'Error during comparison' };
        }
      })
    );
  }

  return results;
};

// ─── Fallback heuristic mock ─────────────────────────────────────────────────
const getMockAIScanResult = (filePath) => {
  const filename = path.basename(filePath).toLowerCase();
  let mockItems = [];

  if (filename.includes("kurti") || filename.includes("blue")) {
    mockItems = [
      { category: "kurti", color: "blue", confidence: 0.94 },
      { category: "pants", color: "black", confidence: 0.91 },
    ];
  } else if (filename.includes("shirt") || filename.includes("white")) {
    mockItems = [
      { category: "shirt", color: "white", confidence: 0.92 },
      { category: "pants", color: "jeans", confidence: 0.88 },
    ];
  } else {
    mockItems = [
      { category: "kurti", color: "blue", confidence: 0.94 },
      { category: "pants", color: "black", confidence: 0.91 },
    ];
  }

  return {
    items: mockItems,
    isFallback: true,
    message: process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()
      ? undefined
      : "AI scanning is using fallback mode (No GEMINI_API_KEY set).",
  };
};

module.exports = { analyzeOutfitImage, visuallyMatchItemsInOutfit };
