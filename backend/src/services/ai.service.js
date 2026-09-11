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

      const prompt = `Analyze this outfit photo for wardrobe tracking. Identify all clothing items visible (tops, bottomwear, dresses, kurtis, shirts, pants, etc.).
Return ONLY a raw JSON object with key "items", which is an array of objects.
Each object must have:
- "category": (string, e.g., "kurti", "shirt", "top", "pants", "jeans", "skirt", "dress", "saree", "scarf", "dupatta")
- "color": (string, primary color e.g., "blue", "black", "white", "green", "pink", "beige", "cream", "red")
- "confidence": (number between 0.60 and 0.98)

Example format:
{
  "items": [
    { "category": "kurti", "color": "blue", "confidence": 0.94 },
    { "category": "pants", "color": "black", "confidence": 0.91 }
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

// ─── Step 2: Visual match — compare outfit photo vs each wardrobe item image ─
/**
 * Given the outfit photo path and an array of wardrobe items (each with imageUrl),
 * asks Gemini to check whether each wardrobe item is visually present in the outfit.
 * Returns a score map: { itemId -> { present: bool, confidence: float, reason: string } }
 */
const visuallyMatchItemsInOutfit = async (outfitImagePath, wardrobeItems, serverBaseUrl) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null; // No key — caller falls back to text matching

  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Read outfit image once
  const outfitBuffer = fs.readFileSync(outfitImagePath);
  const outfitBase64 = outfitBuffer.toString("base64");
  const outfitExt = path.extname(outfitImagePath).toLowerCase();
  const outfitMime = outfitExt === ".png" ? "image/png" : outfitExt === ".webp" ? "image/webp" : "image/jpeg";

  const results = {};

  // Check each wardrobe item visually (parallel, up to 6 at once to avoid rate limits)
  const BATCH_SIZE = 6;
  for (let i = 0; i < wardrobeItems.length; i += BATCH_SIZE) {
    const batch = wardrobeItems.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (item) => {
        try {
          // Resolve wardrobe item image from local disk
          const relPath = (item.imageUrl || "").replace(/^\//, "");
          const localPath = path.join(__dirname, "../../..", "uploads", path.basename(relPath));

          if (!fs.existsSync(localPath)) {
            results[item._id] = { present: false, confidence: 0, reason: "Image not found locally" };
            return;
          }

          const itemBuffer = fs.readFileSync(localPath);
          const itemBase64 = itemBuffer.toString("base64");
          const itemExt = path.extname(localPath).toLowerCase();
          const itemMime = itemExt === ".png" ? "image/png" : itemExt === ".webp" ? "image/webp" : "image/jpeg";

          const prompt = `You are a clothing detection expert.
Image 1 is a photo of someone wearing an outfit today.
Image 2 is a saved wardrobe item (${item.category}, typically ${item.color || "unknown color"}).

Answer ONLY with a raw JSON object (no markdown):
{
  "present": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "one short sentence"
}

Is the exact clothing item in Image 2 visible and being worn in Image 1?`;

          const result = await model.generateContent([
            prompt,
            { inlineData: { data: outfitBase64, mimeType: outfitMime } },
            { inlineData: { data: itemBase64, mimeType: itemMime } },
          ]);

          const text = (await result.response.text()) || "";
          const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          results[item._id] = {
            present: !!parsed.present,
            confidence: parseFloat(parsed.confidence) || 0,
            reason: parsed.reason || "",
          };
        } catch (err) {
          console.warn(`[Visual Match]: Failed for item ${item._id}:`, err.message);
          results[item._id] = { present: false, confidence: 0, reason: "Error during comparison" };
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
