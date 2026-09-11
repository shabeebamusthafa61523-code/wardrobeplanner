const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const { scanOutfit, getRecommendation } = require('../controllers/ai.controller');

router.post('/scan-outfit', upload.single('image'), scanOutfit);
router.get('/recommendation', getRecommendation);

module.exports = router;
