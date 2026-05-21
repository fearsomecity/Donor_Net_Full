const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['donor', 'hospital', 'admin'],
    required: true
  },
  
  // ── Donor Specific Fields ───────────────────────────────────────
  donorProfile: {
    name: { type: String, trim: true },
    bloodType: { 
      type: String, 
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] 
    },
    age: { type: Number, min: 18, max: 65 },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    city: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    // Privacy toggle — if false, donor is hidden from emergency broadcasts
    privacyVisible: { type: Boolean, default: true },
    // NBTC health self-declaration — donor can only receive requests after this is true
    healthCheckCompleted: { type: Boolean, default: false },
    // Computed eligibility flag (set by backend on donation or health-check)
    isEligible: { type: Boolean, default: false },
    lastDonationDate: { type: Date },
    // nextEligibleDate — men: +90 days, women: +120 days from lastDonationDate
    nextEligibleDate: { type: Date },
    donations: [{ 
      date: { type: Date, default: Date.now },
      hospitalName: String,
      units: { type: Number, default: 1 },
      bloodType: String,
      donationToken: String // Scanned token that confirmed this donation
    }],
    notifications: [{
      type: { type: String, enum: ['urgent_match', 'appointment_reminder', 'system'], default: 'system' },
      title: String,
      message: String,
      link: String,
      requestId: { type: mongoose.Schema.Types.ObjectId }, // Link back to the UrgentRequest
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }]
  },

  // ── Hospital Specific Fields ────────────────────────────────────
  hospitalProfile: {
    hospitalName: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    // India regulatory fields
    cdscoBankLicenseNumber: { type: String, trim: true },
    eRaktKoshId: { type: String, trim: true },
    // Admin-controlled: 'pending' → 'approved' | 'rejected'
    verificationStatus: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    inventory: {
      'A+': { type: Number, default: 0 },
      'A-': { type: Number, default: 0 },
      'B+': { type: Number, default: 0 },
      'B-': { type: Number, default: 0 },
      'O+': { type: Number, default: 0 },
      'O-': { type: Number, default: 0 },
      'AB+': { type: Number, default: 0 },
      'AB-': { type: Number, default: 0 },
    }
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ── Pre-save Hook: Hash Password ───────────────────────────────────
userSchema.pre('save', async function(next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to verify password
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false; // In case password is not selected
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
