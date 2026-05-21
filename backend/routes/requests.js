const express = require('express');
const router = express.Router();
const UrgentRequest = require('../models/UrgentRequest');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Create Urgent Request (Hospital only)
// POST /api/requests
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ message: 'Access denied. Only hospitals can post requests.' });
    }

    const { bloodType, unitsNeeded, urgencyLevel, zipCode, city, message, hospitalName } = req.body;
    
    if (!bloodType || !unitsNeeded || !zipCode) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newRequest = new UrgentRequest({
      hospitalId: req.user.id,
      hospitalName: hospitalName || 'Hospital',
      bloodType,
      unitsNeeded,
      urgencyLevel,
      zipCode,
      city,
      message
    });

    await newRequest.save();

    // Smart Matching: Notify matched donors in the background
    try {
      const matchedDonors = await User.find({
        role: 'donor',
        'donorProfile.bloodType': bloodType,
        'donorProfile.zipCode': zipCode,
        'donorProfile.isEligible': true,
        'donorProfile.privacyVisible': true,
        'donorProfile.healthCheckCompleted': true
      });

      if (matchedDonors.length > 0) {
        const notification = {
          type: 'urgent_match',
          title: 'Urgent Match Near You!',
          message: `${hospitalName || 'A hospital'} urgently needs ${bloodType} blood. You are a match!`,
          link: `/donor/urgent-needs`,
          requestId: newRequest._id,
          createdAt: new Date()
        };

        await User.updateMany(
          { _id: { $in: matchedDonors.map(d => d._id) } },
          { $push: { 'donorProfile.notifications': { $each: [notification], $position: 0 } } }
        );
        console.log(`📢 Notified ${matchedDonors.length} matching donors.`);
      }
    } catch (notifyErr) {
      console.error('❌ Notification Error:', notifyErr.message);
    }

    res.status(201).json(newRequest);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get Nearby Requests (Donor feed)
// GET /api/requests/nearby?zipCode=110001
router.get('/nearby', authMiddleware, async (req, res) => {
  try {
    const { zipCode } = req.query;
    if (!zipCode) return res.status(400).json({ message: 'Zip code required' });

    const requests = await UrgentRequest.find({ 
      zipCode, 
      status: 'active' 
    }).sort({ urgencyLevel: -1, createdAt: -1 }).select('-acceptedDonors');

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get Hospital's Active Requests (Hospital only)
// GET /api/requests/hospital
router.get('/hospital', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') return res.status(403).json({ message: 'Access denied' });
    const requests = await UrgentRequest.find({ hospitalId: req.user.id, status: 'active' });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Incoming Offers for a Hospital (accepted donors for all their requests)
// GET /api/requests/incoming
router.get('/incoming', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') return res.status(403).json({ message: 'Access denied' });
    const requests = await UrgentRequest.find({ 
      hospitalId: req.user.id,
      'acceptedDonors.0': { $exists: true }
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get All Active Requests (For inter-hospital B2B view)
// GET /api/requests/all
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const requests = await UrgentRequest.find({ status: 'active' })
      .sort({ urgencyLevel: -1, createdAt: -1 })
      .select('-acceptedDonors');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Donor Accepts an Emergency Request
// POST /api/requests/:id/accept
router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'donor') {
      return res.status(403).json({ message: 'Only donors can accept emergency requests.' });
    }

    const request = await UrgentRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'active') return res.status(400).json({ message: 'This request is no longer active.' });

    const alreadyAccepted = request.acceptedDonors.some(d => d.donorId?.toString() === req.user.id);
    if (alreadyAccepted) return res.status(400).json({ message: 'You have already accepted this request.' });

    const donor = await User.findById(req.user.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });

    const { v4: uuidv4 } = require('uuid');
    const donationToken = uuidv4().slice(0, 8).toUpperCase();

    request.acceptedDonors.push({
      donorId: req.user.id,
      donorName: donor.donorProfile?.name || 'Anonymous',
      contactPhone: donor.email || 'N/A', // Fixed Bug B: change from zipCode to email
      donationToken
    });

    await request.save();

    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        'donorProfile.notifications': {
          $each: [{
            type: 'system',
            title: 'Request Accepted!',
            message: `You've committed to donating ${request.bloodType} at ${request.hospitalName}. Your token is: ${donationToken}. Show this at reception.`,
            read: false,
            createdAt: new Date()
          }],
          $position: 0
        }
      }
    });

    res.json({ 
      message: 'Successfully accepted! Please visit the hospital and show your donation token.',
      donationToken,
      hospital: request.hospitalName 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Confirm Donation via Token (Hospital scans token at reception)
// POST /api/requests/:id/confirm-token
router.post('/:id/confirm-token', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') return res.status(403).json({ message: 'Only hospitals can confirm tokens.' });

    const { donationToken } = req.body;
    const request = await UrgentRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const donorEntry = request.acceptedDonors.find(d => d.donationToken === donationToken);
    if (!donorEntry) return res.status(404).json({ message: 'Invalid donation token.' });
    if (donorEntry.donationStatus === 'donated') return res.status(400).json({ message: 'Token already used.' });

    donorEntry.donationStatus = 'donated';
    if (request.unitsNeeded > 0) request.unitsNeeded -= 1;
    if (request.unitsNeeded <= 0) request.status = 'fulfilled';

    await request.save();

    await User.findByIdAndUpdate(donorEntry.donorId, {
      $push: { 'donorProfile.donations': {
        date: new Date(),
        hospitalName: request.hospitalName,
        units: 1,
        bloodType: request.bloodType,
        donationToken
      }},
      $set: {
        'donorProfile.lastDonationDate': new Date(),
        'donorProfile.isEligible': false
      }
    });

    res.json({ message: 'Donation confirmed! Records updated.', donorName: donorEntry.donorName });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Fulfill Inter-Hospital B2B Request
// POST /api/requests/:id/fulfill
router.post('/:id/fulfill', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') return res.status(403).json({ message: 'Only hospitals can fulfill inter-hospital requests' });

    const { transferUnits, type } = req.body;
    if (!transferUnits || !type) return res.status(400).json({ message: 'Missing transfer units or blood type' });

    const request = await UrgentRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'active') return res.status(400).json({ message: 'Request is no longer active' });

    const hospital = await User.findById(req.user.id);
    if (!hospital || !hospital.hospitalProfile || !hospital.hospitalProfile.inventory) {
      return res.status(400).json({ message: 'Hospital profile not found or inventory empty' });
    }

    const currentStock = hospital.hospitalProfile.inventory[type] || 0;
    if (currentStock < transferUnits) {
      return res.status(400).json({ message: `Insufficient inventory. You only have ${currentStock} units of ${type}.` });
    }

    hospital.hospitalProfile.inventory[type] -= transferUnits;
    hospital.markModified('hospitalProfile.inventory');
    await hospital.save();

    if (request.unitsNeeded <= transferUnits) {
      request.status = 'fulfilled';
      request.unitsNeeded = 0;
    } else {
      request.unitsNeeded -= transferUnits;
    }
    await request.save();

    res.json({ message: 'Successfully transferred units', remainingUnitsNeeded: request.unitsNeeded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Cancel / Close Request
// DELETE /api/requests/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const request = await UrgentRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.hospitalId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You do not own this request.' });
    }

    request.status = 'fulfilled';
    await request.save();
    res.json({ message: 'Request marked as fulfilled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
