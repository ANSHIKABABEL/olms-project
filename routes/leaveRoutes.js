const express = require('express');
const router = express.Router();
const Leave = require('../models/leave');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// Authentication middleware
function auth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// Helper function to flag suspicious leaves
function isSuspicious(fromDate, toDate) {
  const days = (new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24);
  return days > 7;
}

// ✅ Apply leave
router.post('/', auth, async (req, res) => {
  try {
    const { fromDate, toDate, reason } = req.body;

    if (!fromDate || !toDate) {
      return res.status(400).json({ success: false, message: 'Please send all required fields.' });
    }

    const flagged = isSuspicious(fromDate, toDate);

    const newLeave = new Leave({
      name: req.user.name,
      employeeId: req.user.employeeId,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason,
      flagged,
      status: 'pending'
    });

    await newLeave.save();
    res.status(201).json({ success: true, message: 'Leave applied successfully.', flagged });
  } catch (err) {
    console.error('Apply leave error:', err);
    res.status(500).json({ success: false, message: 'Error applying leave.' });
  }
});

// ✅ Get leaves for current user (or all for admin)
router.get('/', auth, async (req, res) => {
  try {
    let leaves;
    if (req.user.role === 'admin') {
      leaves = await Leave.find();
    } else {
      leaves = await Leave.find({ employeeId: req.user.employeeId });
    }
    res.json(leaves);
  } catch (err) {
    console.error('Fetch leaves error:', err);
    res.status(500).json({ success: false, message: 'Error fetching leaves.' });
  }
});

// ✅ Cancel or delete leave
router.delete('/:id', auth, async (req, res) => {
  console.log("DELETE request received for id:", req.params.id);
  console.log("User making request:", req.user);

  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    if (req.user.role !== 'admin' && leave.employeeId !== req.user.employeeId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await leave.deleteOne();
    res.json({ success: true, message: 'Leave cancelled successfully' });
  } catch (err) {
    console.error('Cancel leave error:', err);
    res.status(500).json({ success: false, message: 'Error cancelling leave' });
  }
});


// ✅ Admin update status (approve/reject)
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { status } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    leave.status = status;
    await leave.save();

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, message: 'Error updating status' });
  }
});

module.exports = router;
