const express = require('express');
const router = express.Router();
const UrgentRequest = require('../models/UrgentRequest');
const authMiddleware = require('../middleware/authMiddleware');

// Get smart matches for a donor
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'donor') return res.status(403).json({ message: 'Only donors can access matches' });
    
    const { bloodType, zipCode } = req.query;
    if (!bloodType || !zipCode) return res.status(400).json({ message: 'Blood type and zip code are required' });

    // Find urgent requests that match the donor's blood type and are in the same zip code
    // In a real app, you'd use a geospatial query for "nearby"
    const matches = await UrgentRequest.find({
      bloodType,
      zipCode,
      status: 'active'
    }).sort({ urgencyLevel: -1, createdAt: -1 });

    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
