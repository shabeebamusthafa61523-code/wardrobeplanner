const User = require('../models/User');
const WardrobeItem = require('../models/WardrobeItem');
const Outfit = require('../models/Outfit');
const WearRecord = require('../models/WearRecord');
const bcrypt = require('bcryptjs');

// GET /api/admin/users — list all registered users with stats
const getAllUsers = async (req, res) => {
  try {
    // Include name but NOT password hash
    const users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();

    const withStats = await Promise.all(
      users.map(async (u) => {
        const [itemCount, outfitCount] = await Promise.all([
          WardrobeItem.countDocuments({ userId: u._id.toString() }),
          Outfit.countDocuments({ userId: u._id.toString() }),
        ]);
        return { ...u, itemCount, outfitCount };
      })
    );

    res.json({ success: true, count: withStats.length, data: withStats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/admin/users/:userId — single user credentials (name, role, dates — no password hash)
const getUserCredentials = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/admin/users/:userId/wardrobe — all wardrobe items for a user
const getUserWardrobe = async (req, res) => {
  try {
    const { userId } = req.params;
    const items = await WardrobeItem.find({ userId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/admin/users/:userId/history — outfit history for a user
const getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const outfits = await Outfit.find({ userId })
      .populate('itemIds')
      .sort({ date: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, count: outfits.length, data: outfits });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/admin/users/:userId — remove a user account
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    await WardrobeItem.deleteMany({ userId });
    await Outfit.deleteMany({ userId });
    await WearRecord.deleteMany({ userId });
    res.json({ success: true, message: 'User and all their data deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PATCH /api/admin/users/:userId/role — promote/demote user role
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    if (!['user', 'superadmin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role.' });
    }
    const updated = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PATCH /api/admin/users/:userId/password — reset any user's password
const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters.' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hashed });
    res.json({ success: true, message: '✓ Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserCredentials,
  getUserWardrobe,
  getUserHistory,
  deleteUser,
  updateUserRole,
  resetUserPassword,
};

