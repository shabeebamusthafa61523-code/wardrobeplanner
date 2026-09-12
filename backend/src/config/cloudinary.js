require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

/**
 * Upload a local file directly to Cloudinary (Strict Cloudinary Storage)
 * @param {string} localFilePath - Path to temp file stored locally by multer
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
const uploadToCloudinary = async (localFilePath, folder = 'wardrobe_items') => {
  if (!localFilePath) {
    throw new Error('No local image file provided for Cloudinary upload.');
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) missing in .env');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: 'auto',
    });

    // Clean up temporary local file after Cloudinary upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return result;
  } catch (error) {
    // Clean up local temp file on error too
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error('Cloudinary Upload Failed:', error.message || error);
    throw new Error(`Cloudinary upload failed: ${error.message || 'Check Cloudinary credentials and API limit.'}`);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
};
