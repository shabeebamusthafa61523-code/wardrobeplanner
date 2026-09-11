const express = require('express');
const router = express.Router();
const {
  getWeeklyPlanner,
  setPlannerDayOutfit,
  removePlannerDayOutfit,
} = require('../controllers/planner.controller');

router.get('/week', getWeeklyPlanner);
router.post('/', setPlannerDayOutfit);
router.delete('/:day', removePlannerDayOutfit);

module.exports = router;
