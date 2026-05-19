const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  user_name: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },

  user_email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  upload_count: {
    type: Number,
    default: 0
  },

  is_active: {
    type: Boolean,
    default: true
  },

  created_at: {
    type: Date,
    default: Date.now
  },

  last_login: {
    type: Date
  }

}, {
  timestamps: true
});


// ─── Create Unique Index ─────────────────────────────────────────────
userSchema.index({ user_email: 1 }, { unique: true });


// ─── Hash Password Before Save ──────────────────────────────────────
userSchema.pre('save', async function () {

  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);

});


// ─── Compare Password ───────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {

  return await bcrypt.compare(candidatePassword, this.password);

};


// ─── Remove Password From JSON ──────────────────────────────────────
userSchema.methods.toJSON = function () {

  const user = this.toObject();

  delete user.password;

  return user;

};


module.exports = mongoose.model('User', userSchema);