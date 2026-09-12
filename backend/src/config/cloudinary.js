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

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('Cloudinary credentials missing in .env');
    return null;
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

    // Clean up temporary local file after successful Cloudinary upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return result;
  } catch (error) {
    console.warn('Cloudinary Upload Notice (Falling back to local storage):', error.message || error);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
};
