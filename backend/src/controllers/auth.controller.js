const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth.middleware');

const register = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ success: false, error: 'Name and Password are required' });
    }

    const cleanName = name.toLowerCase().trim();

    const existingUser = await User.findOne({ name: cleanName });
    if (existingUser) {
      return res.status(409).json({ success: false, error: `An account named "${cleanName}" already exists. Please Sign In.` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: cleanName,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { userId: newUser._id.toString(), name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: `✓ Welcome, ${newUser.name}! Account created.`,
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ success: false, error: 'Name and Password are required' });
    }

    const cleanName = name.toLowerCase().trim();

    const user = await User.findOne({ name: cleanName });
    if (!user) {
      return res.status(401).json({ success: false, error: `No user found named "${cleanName}". Please register.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect password.' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    if (req.userId === 'default-user') {
      return res.json({
        success: true,
        user: { _id: 'default-user', name: 'demo user', role: 'user' },
      });
    }

    const user = await User.findById(req.userId).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/auth/elevate — PIN-protected superadmin promotion
const ADMIN_PIN = process.env.ADMIN_PIN || '123456';

const elevateToAdmin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || pin.toString() !== ADMIN_PIN) {
      return res.status(403).json({ success: false, error: 'Incorrect PIN.' });
    }

    if (req.userId === 'default-user' || !req.userId) {
      return res.status(401).json({ success: false, error: 'You must be logged in to use this.' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { role: 'superadmin' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Issue a fresh token with the new role
    const token = jwt.sign(
      { userId: user._id.toString(), name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: `✓ ${user.name} is now a superadmin!`,
      token,
      user: { _id: user._id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  elevateToAdmin,
};
