const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Get all verified hospitals (Public / Donors)
// GET /api/hospitals
router.get('/', async (req, res) => {
  try {
    const hospitals = await User.find({ 
      role: 'hospital',
      'hospitalProfile.verificationStatus': 'approved' 
    }).select('hospitalProfile _id');
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get Hospital Inventory
// GET /api/hospitals/inventory
router.get('/inventory', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Access denied. Hospital role required.' });
    }

    const hospital = await User.findById(req.user.id).select('hospitalProfile');
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    res.json(hospital.hospitalProfile.inventory);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update Hospital Inventory (Simplified for tests)
// POST /api/hospitals/inventory/update
router.post('/inventory/update', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { type, quantity } = req.body;
    if (!type || quantity === undefined) return res.status(400).json({ message: 'Missing type or quantity' });

    const updateField = `hospitalProfile.inventory.${type}`;
    const hospital = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { [updateField]: parseInt(quantity) } },
      { new: true }
    ).select('hospitalProfile');

    res.json({ message: 'Inventory updated', inventory: hospital.hospitalProfile.inventory });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Real PUT endpoint for production/frontend
router.put('/inventory', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') return res.status(403).json({ message: 'Access denied' });

    const { inventory } = req.body;
    if (!inventory) return res.status(400).json({ message: 'Missing inventory data' });

    const hospital = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { 'hospitalProfile.inventory': inventory } },
      { new: true }
    ).select('hospitalProfile');

    res.json({ message: 'Inventory updated successfully', inventory: hospital.hospitalProfile.inventory });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
