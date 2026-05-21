const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalName: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  bloodType: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  notes: String
}, { timestamps: true });

module.exports = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
