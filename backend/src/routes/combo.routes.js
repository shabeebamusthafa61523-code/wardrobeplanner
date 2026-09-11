const express = require('express');
const router = express.Router();
const {
  getSavedCombos,
  createSavedCombo,
  deleteSavedCombo,
} = require('../controllers/combo.controller');

router.get('/', getSavedCombos);
router.post('/', createSavedCombo);
router.delete('/:id', deleteSavedCombo);

module.exports = router;
