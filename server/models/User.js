const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ],
    index: true // Indexed for faster login queries
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  role: {
    type: String,
    enum: ['player', 'coach', 'scout', 'admin', 'parent'],
    default: 'player',
    index: true // Indexed for role-based queries
  },
  // Player-specific fields
  school: {
    type: String,
    trim: true,
    index: true // Indexed for school-based queries
  },
  district: {
    type: String,
    trim: true,
    index: true // Indexed for district-based queries
  },
  dateOfBirth: {
    type: Date
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  profileImage: {
    type: String // URL to image
  },
  phone: {
    type: String,
    trim: true
  },
  // Stats snapshot for quick access (detailed stats in PlayerStats collection)
  stats: {
    matches: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    battingAvg: { type: Number, default: 0 },
    bowlingAvg: { type: Number, default: 0 }
  },
  // For security
  isActive: {
    type: Boolean,
    default: true
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  // For coaches and scouts
  organization: String,
  position: String,
  credentials: [String],
  // Social media links
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    youtube: String
  },
  // Privacy settings
  privacySettings: {
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    showStats: { type: Boolean, default: true },
    showMedia: { type: Boolean, default: true }
  },
  // Notification preferences
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    messages: { type: Boolean, default: true }
  },
  // Network relationships
  favoriteCoaches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  connectedScouts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingScoutRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields for age calculation
UserSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Index for combining fields for search
UserSchema.index({ name: 'text', school: 'text', district: 'text' });

// Method to compare password for login
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Pre-save hook to hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(12);
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Add a method for safely returning user data (excluding sensitive fields)
UserSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  
  // Always delete sensitive fields
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  
  // Apply privacy settings
  if (this.privacySettings) {
    if (!this.privacySettings.showEmail) delete userObject.email;
    if (!this.privacySettings.showPhone) delete userObject.phone;
    if (!this.privacySettings.showStats) delete userObject.stats;
  }
  
  return userObject;
};

const User = mongoose.model('User', UserSchema);

module.exports = { User }; 