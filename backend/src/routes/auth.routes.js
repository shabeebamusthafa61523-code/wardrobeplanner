const express = require('express');
const router = express.Router();
const { register, login, getMe, elevateToAdmin } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.post('/elevate', authMiddleware, elevateToAdmin);

module.exports = router;
