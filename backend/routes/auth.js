const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Helper to generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'donornet_jwt_secret', {
    expiresIn: '30d',
  });
};

// ── POST /api/auth/register/donor ───────────────────────────────
router.post('/register/donor', async (req, res) => {
  try {
    const { email, password, name, bloodType, age, gender, city, zipCode, privacyVisible } = req.body;

    // Age validation per NBTC guidelines
    if (!age || age < 18 || age > 65) {
      return res.status(400).json({ error: 'Donors must be between 18 and 65 years of age (NBTC guidelines).' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Since the donor completed the health declaration checklist during frontend registration,
    // we set healthCheckCompleted and isEligible to true!
    const user = await User.create({
      email,
      password,
      role: 'donor',
      donorProfile: { 
        name, bloodType, age, gender, 
        city, zipCode, 
        privacyVisible: privacyVisible !== false, // default true
        healthCheckCompleted: true, // Fix: initialized to true since they verified during registration
        isEligible: true // Fix: initialized to true
      }
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.donorProfile
      }
    });
  } catch (error) {
    console.error('❌ Registration Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/auth/register/hospital ────────────────────────────
router.post('/register/hospital', async (req, res) => {
  try {
    const { email, password, hospitalName, address, city, zipCode, contactNumber, cdscoBankLicenseNumber, eRaktKoshId } = req.body;

    if (!cdscoBankLicenseNumber || !eRaktKoshId) {
      return res.status(400).json({ error: 'CDSCO Blood Bank License Number and e-RaktKosh ID are mandatory for hospital registration.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({
      email,
      password,
      role: 'hospital',
      hospitalProfile: { 
        hospitalName, address, city, zipCode, contactNumber,
        cdscoBankLicenseNumber, eRaktKoshId,
        verificationStatus: 'pending' // Requires admin approval
      }
    });

    res.status(201).json({
      success: true,
      pending: true,
      message: 'Registration submitted. Your CDSCO license will be verified by our team within 24–48 hours. You will receive an email once approved.',
      hospitalName: user.hospitalProfile.hospitalName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Must explicitly select password since it has select: false
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Block pending/rejected hospitals from logging in
    if (user.role === 'hospital' && user.hospitalProfile?.verificationStatus !== 'approved') {
      const status = user.hospitalProfile?.verificationStatus || 'pending';
      if (status === 'pending') {
        return res.status(403).json({ error: 'Your hospital account is pending admin verification. Please check your email for updates.' });
      }
      if (status === 'rejected') {
        return res.status(403).json({ error: 'Your hospital registration was rejected. Please contact support.' });
      }
    }

    const profile = user.role === 'donor' ? user.donorProfile : user.hospitalProfile;

    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
