const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Get today's appointments for hospital
router.get('/today', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') return res.status(403).json({ message: 'Unauthorized' });

    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);

    const appointments = await Appointment.find({
      hospitalId: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'scheduled'
    }).populate('donorId', 'email donorProfile');

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Complete an appointment
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') return res.status(403).json({ message: 'Unauthorized' });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Update appointment status
    appointment.status = 'completed';
    await appointment.save();

    // Update Donor Health History & Next Eligible Date
    const donor = await User.findById(appointment.donorId);
    if (donor) {
      const donationDate = appointment.date;
      const nextDate = new Date(donationDate);
      nextDate.setDate(nextDate.getDate() + 56); // 8 weeks gap

      donor.donorProfile.lastDonationDate = donationDate;
      donor.donorProfile.nextEligibleDate = nextDate;
      donor.donorProfile.donations.push({
        date: donationDate,
        hospitalName: appointment.hospitalName,
        units: 1,
        bloodType: appointment.bloodType
      });
      await donor.save();
    }

    // Update Hospital Inventory
    const hospital = await User.findById(req.user.id);
    if (hospital && hospital.hospitalProfile) {
      const type = appointment.bloodType;
      hospital.hospitalProfile.inventory[type] = (hospital.hospitalProfile.inventory[type] || 0) + 1;
      hospital.markModified('hospitalProfile.inventory');
      await hospital.save();
    }

    res.json({ message: 'Appointment completed and records updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
