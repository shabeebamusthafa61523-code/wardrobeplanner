const express = require('express');
const router = express.Router();
const {
  recordWear,
  getWearHistory,
  getItemWearHistory,
  getTodayOutfit,
  deleteTodayOutfit,
} = require('../controllers/wear.controller');

router.post('/', recordWear);
router.get('/history', getWearHistory);
router.get('/today', getTodayOutfit);
router.delete('/today', deleteTodayOutfit);
router.get('/item/:itemId', getItemWearHistory);

module.exports = router;
