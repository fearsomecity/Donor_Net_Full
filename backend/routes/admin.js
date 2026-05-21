const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ── Admin Auth Middleware ─────────────────────────────────────────
const adminOnly = (req, res, next) => {
  const auth = req.headers.authorization || req.header('Authorization');
  if (!auth)
    return res.status(401).json({ error: 'No token provided' });
  try {
    const token = auth.startsWith('Bearer ') ? auth.split(' ')[1] : auth;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'donornet_jwt_secret');
    if (decoded.role !== 'admin')
      return res.status(403).json({ error: 'Admin access only' });
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ── GET /api/admin/stats ──────────────────────────────────────────
router.get('/stats', adminOnly, async (req, res) => {
  try {
    const [totalDonors, pendingHospitals, approvedHospitals, rejectedHospitals] = await Promise.all([
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'hospital', 'hospitalProfile.verificationStatus': 'pending' }),
      User.countDocuments({ role: 'hospital', 'hospitalProfile.verificationStatus': 'approved' }),
      User.countDocuments({ role: 'hospital', 'hospitalProfile.verificationStatus': 'rejected' }),
    ]);
    res.json({ totalDonors, pendingHospitals, approvedHospitals, rejectedHospitals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/hospitals/pending ─────────────────────────────
router.get('/hospitals/pending', adminOnly, async (req, res) => {
  try {
    const hospitals = await User.find({
      role: 'hospital',
      'hospitalProfile.verificationStatus': 'pending'
    }).select('-password').sort({ createdAt: -1 });
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/hospitals/all ─────────────────────────────────
router.get('/hospitals/all', adminOnly, async (req, res) => {
  try {
    const hospitals = await User.find({ role: 'hospital' })
      .select('-password').sort({ createdAt: -1 });
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/donors ────────────────────────────────────────
router.get('/donors', adminOnly, async (req, res) => {
  try {
    const donors = await User.find({ role: 'donor' })
      .select('-password').sort({ createdAt: -1 });
    res.json(donors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/hospitals/:id/approve ────────────────────────
router.post('/hospitals/:id/approve', adminOnly, async (req, res) => {
  try {
    const hospital = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'hospital' },
      { $set: { 'hospitalProfile.verificationStatus': 'approved' } },
      { new: true }
    ).select('-password');
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    res.json({ message: 'Hospital approved successfully', hospital });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/hospitals/:id/reject ─────────────────────────
router.post('/hospitals/:id/reject', adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const hospital = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'hospital' },
      { $set: { 'hospitalProfile.verificationStatus': 'rejected' } },
      { new: true }
    ).select('-password');
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    res.json({ message: `Hospital rejected${reason ? `: ${reason}` : ''}`, hospital });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/donors/:id/verify ────────────────────────────
router.post('/donors/:id/verify', adminOnly, async (req, res) => {
  try {
    const donor = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'donor' },
      { 
        $set: { 
          'donorProfile.isEligible': true,
          'donorProfile.healthCheckCompleted': true 
        } 
      },
      { new: true }
    ).select('-password');
    if (!donor) return res.status(404).json({ error: 'Donor not found' });
    res.json({ message: 'Donor health verified and marked as eligible', donor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/seed ─────────────────────────────────────────
// One-time route to create the admin account
router.post('/seed', async (req, res) => {
  try {
    const { secretKey, email, password } = req.body;
    if (secretKey !== (process.env.ADMIN_SEED_KEY || 'donornet_admin_seed_2024'))
      return res.status(403).json({ error: 'Invalid seed key' });

    const existing = await User.findOne({ role: 'admin' });
    if (existing) return res.status(400).json({ error: 'Admin already exists. Email: ' + existing.email });

    const admin = await User.create({ email, password, role: 'admin' });
    res.status(201).json({ message: 'Admin account created successfully', email: admin.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
