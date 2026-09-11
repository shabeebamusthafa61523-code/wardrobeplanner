const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserCredentials,
  getUserWardrobe,
  getUserHistory,
  deleteUser,
  updateUserRole,
  resetUserPassword,
} = require('../controllers/admin.controller');

router.get('/users', getAllUsers);
router.get('/users/:userId', getUserCredentials);
router.get('/users/:userId/wardrobe', getUserWardrobe);
router.get('/users/:userId/history', getUserHistory);
router.delete('/users/:userId', deleteUser);
router.patch('/users/:userId/role', updateUserRole);
router.patch('/users/:userId/password', resetUserPassword);

module.exports = router;
