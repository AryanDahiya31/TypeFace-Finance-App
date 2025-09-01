  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // only check if provided
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true, // still important to avoid duplicates
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // keep only a minimum check
    select: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

  // Hash password before saving
  userSchema.pre('save', async function(next) {
    // Only hash if password is modified
    if (!this.isModified('password')) return next();
    
    try {
      // Hash password with cost of 12
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });

  // Instance method to check password
  userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Static method to find user by email with password
  userSchema.statics.findByCredentials = async function(email, password) {
    const user = await this.findOne({ email }).select('+password');
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }
    
    return user;
  };

  module.exports = mongoose.model('User', userSchema);