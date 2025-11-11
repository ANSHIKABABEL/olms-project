// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// ---------------------- REGISTER ----------------------
router.post('/register', async (req, res) => {
  try {
    const { name, employeeId, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (role === 'admin') {
      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ success: false, message: 'Admin already exists' });
      }

      // ✅ Don’t hash manually — Admin model handles it
      const admin = new Admin({ name, email, password });
      await admin.save();

      return res.status(201).json({ success: true, message: 'Admin registered successfully' });
    } else {
      if (!employeeId) {
        return res.status(400).json({ success: false, message: 'Employee ID required for employees' });
      }

      const existingUser = await User.findOne({ $or: [{ email }, { employeeId }] });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email or Employee ID already exists' });
      }

      // ✅ Keep manual hashing for User since its schema doesn’t have pre-save hash
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, employeeId, email, password: hashedPassword, role });
      await user.save();

      return res.status(201).json({ success: true, message: 'User registered successfully' });
    }
  } catch (err) {
    console.error('Error in /register:', err);
    res.status(500).json({ success: false, message: 'Error registering user/admin' });
  }
});


// ---------------------- LOGIN ----------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    let user;

    // Search in correct collection based on role
    if (role === 'admin') {
      user = await Admin.findOne({ email });
    } else {
      user = await User.findOne({ email });
    }

    if (!user) {
      console.log(`No ${role} found with email: ${email}`);
      return res.status(404).json({ success: false, message: `${role} not found` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: role,
        name: user.name,
        employeeId: user.employeeId || 'N/A'
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      role,
      name: user.name,
      employeeId: user.employeeId || 'N/A'
    });
  } catch (err) {
    console.error('Error in /login:', err);
    res.status(500).json({ success: false, message: 'Error logging in' });
  }
});

module.exports = router;
