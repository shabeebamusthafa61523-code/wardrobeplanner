require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

/**
 * Upload a local file to Cloudinary safely
 * @param {string} localFilePath - Path to temp file stored locally by multer
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<{ secure_url: string, public_id: string } | null>}
 */
const uploadToCloudinary = async (localFilePath, folder = 'wardrobe_items') => {
  if (!localFilePath) return null;

  const cloudUrl = process.env.CLOUDINARY_URL;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ? process.env.CLOUDINARY_CLOUD_NAME.trim() : '';
  const apiKey = process.env.CLOUDINARY_API_KEY ? process.env.CLOUDINARY_API_KEY.trim() : '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET ? process.env.CLOUDINARY_API_SECRET.trim() : '';

  if (cloudUrl && cloudUrl.trim()) {
    cloudinary.config({
      cloudinary_url: cloudUrl.trim(),
    });
  } else if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  } else {
    console.warn('[Cloudinary] Missing credentials (CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET missing in environment)');
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: 'auto',
    });

    // Clean up temporary local file after successful Cloudinary upload
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (e) {
        console.warn('Failed to delete temp file:', e.message);
      }
    }

    return result;
  } catch (error) {
    console.error('[Cloudinary Upload Error]:', error.message || error);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
};
