const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  name: { type: String, required: true },
  employeeId: { type: String, required: true },
  fromDate: { type: String, required: true },  // ✅ changed from Date to String
  toDate: { type: String, required: true },
  reason: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  flagged: { type: Boolean, default: false }
});

module.exports = mongoose.model('Leave', leaveSchema);
