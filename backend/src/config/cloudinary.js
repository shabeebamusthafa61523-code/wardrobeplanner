require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

/**
 * Upload a local file to Cloudinary
 * @param {string} localFilePath - Path to file stored locally by multer
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
const uploadToCloudinary = async (localFilePath, folder = 'wardrobe_items') => {
  try {
    if (!localFilePath) return null;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Check if Cloudinary is configured
    if (!cloudName || !apiKey || !apiSecret) {
      console.log('Cloudinary credentials missing in .env. Falling back to local storage.');
      return null;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: 'auto',
    });

    // Remove local temporary file after successful Cloudinary upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error.message || error);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
};
