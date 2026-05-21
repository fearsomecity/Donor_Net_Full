const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const UrgentRequestSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalName: { type: String, required: true },
  bloodType: { type: String, required: true },
  unitsNeeded: { type: Number, required: true },
  urgencyLevel: { type: String, enum: ['normal', 'high', 'critical'], default: 'normal' },
  zipCode: { type: String, required: true },
  city: { type: String },
  status: { type: String, enum: ['active', 'fulfilled', 'cancelled'], default: 'active' },
  message: String,
  // Tracks each donor who accepted this request
  acceptedDonors: [{
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    donorName: String,
    contactPhone: String, // Only revealed to hospital AFTER donor accepts
    donationToken: { type: String, default: () => uuidv4().slice(0, 8).toUpperCase() },
    acceptedAt: { type: Date, default: Date.now },
    donationStatus: { type: String, enum: ['pending', 'donated', 'no_show'], default: 'pending' }
  }]
}, { timestamps: true });

module.exports = mongoose.models.UrgentRequest || mongoose.model('UrgentRequest', UrgentRequestSchema);
