const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const authMiddleware = require('../middleware/authMiddleware');

// Book an appointment
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'donor') return res.status(403).json({ message: 'Only donors can book appointments' });
    
    const { hospitalId, hospitalName, date, time, bloodType } = req.body;
    
    // Check if appointment already exists for this donor on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23,59,59,999);

    const existing = await Appointment.findOne({
      donorId: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'scheduled'
    });

    if (existing) return res.status(400).json({ message: 'You already have a scheduled appointment for this day' });

    const appointment = new Appointment({
      donorId: req.user.id,
      hospitalId,
      hospitalName,
      date,
      time,
      bloodType
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get current donor's appointments
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ donorId: req.user.id })
      .sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel appointment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.donorId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
