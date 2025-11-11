const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin'], default: 'admin' }
}, { collection: 'admins' });  // explicit collection name

// Hash password before saving
adminSchema.pre('save', async function(next){
  if(this.isModified('password')){
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password for login
adminSchema.methods.comparePassword = function(password){
  return bcrypt.compare(password, this.password);
}

module.exports = mongoose.model('Admin', adminSchema);
