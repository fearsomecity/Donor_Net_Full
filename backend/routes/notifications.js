const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Get user notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('donorProfile.notifications');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const notifications = user.donorProfile?.notifications || [];
    res.json(notifications.sort((a, b) => b.createdAt - a.createdAt));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const notification = user.donorProfile?.notifications?.id(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.read = true;
    await user.save();
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
