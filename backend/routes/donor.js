const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// @route   GET /api/donors/profile
// @desc    Get donor profile
// @access  Private (Donor only)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'donor') {
      return res.status(403).json({ error: 'Access denied. Only donors can view this.' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/donors/profile
// @desc    Update donor profile (e.g., lastDonationDate, zipCode, bloodType)
// @access  Private (Donor only)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'donor') {
      return res.status(403).json({ error: 'Access denied. Only donors can update this.' });
    }

    const { name, bloodType, zipCode, lastDonationDate } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    if (name) user.donorProfile.name = name;
    if (bloodType) user.donorProfile.bloodType = bloodType;
    if (zipCode) user.donorProfile.zipCode = zipCode;
    if (lastDonationDate) user.donorProfile.lastDonationDate = lastDonationDate;

    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/donors/eligibility
// @desc    Check if donor is eligible to donate (56 days since last donation)
// @access  Private (Donor only)
router.get('/eligibility', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'donor') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.donorProfile) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    const lastDonation = user.donorProfile.lastDonationDate;
    
    if (!lastDonation) {
      return res.json({ 
        eligible: true, 
        message: 'You are eligible to donate. Please schedule an appointment.',
        daysSinceLastDonation: null
      });
    }

    const now = new Date();
    const lastDate = new Date(lastDonation);
    const diffTime = Math.abs(now - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 56) {
      res.json({
        eligible: true,
        message: 'You are eligible to donate. Thank you for saving lives!',
        daysSinceLastDonation: diffDays,
        nextEligibleDate: null
      });
    } else {
      const remainingDays = 56 - diffDays;
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 56);
      
      res.json({
        eligible: false,
        message: `You must wait ${remainingDays} more days before your next donation.`,
        daysSinceLastDonation: diffDays,
        nextEligibleDate: nextDate
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error check context' });
  }
});

module.exports = router;
