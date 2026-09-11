const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./src/config/db');
const { authMiddleware } = require('./src/middleware/auth.middleware');
const { superadminMiddleware } = require('./src/middleware/superadmin.middleware');
const wardrobeRoutes = require('./src/routes/wardrobe.routes');
const wearRoutes = require('./src/routes/wear.routes');
const outfitRoutes = require('./src/routes/outfit.routes');
const plannerRoutes = require('./src/routes/planner.routes');
const aiRoutes = require('./src/routes/ai.routes');
const comboRoutes = require('./src/routes/combo.routes');
const authRoutes = require('./src/routes/auth.routes');
const adminRoutes = require('./src/routes/admin.routes');

const app = express();

// Connect MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded clothing images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Personal Wardrobe & Outfit Tracker API',
    time: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/wardrobe', authMiddleware, wardrobeRoutes);
app.use('/api/wear', authMiddleware, wearRoutes);
app.use('/api/outfits', authMiddleware, outfitRoutes);
app.use('/api/planner', authMiddleware, plannerRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/combos', authMiddleware, comboRoutes);
app.use('/api/admin', authMiddleware, superadminMiddleware, adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Error]:', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Server error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Wardrobe Server]: Running on http://localhost:${PORT}`);
});
