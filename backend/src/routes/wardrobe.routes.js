const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const {
  getWardrobeItems,
  getWardrobeItemById,
  createWardrobeItem,
  updateWardrobeItem,
  deleteWardrobeItem,
} = require('../controllers/wardrobe.controller');

router.get('/', getWardrobeItems);
router.get('/:id', getWardrobeItemById);
router.post('/', upload.single('image'), createWardrobeItem);
router.put('/:id', upload.single('image'), updateWardrobeItem);
router.delete('/:id', deleteWardrobeItem);

module.exports = router;
