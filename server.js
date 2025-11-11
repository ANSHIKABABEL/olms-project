// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

const userRoutes = require('./routes/userRoutes');
const leaveRoutes = require('./routes/leaveRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ API routes should come BEFORE static files
app.use('/api/users', userRoutes);
app.use('/api/leaves', leaveRoutes);

// Serve static files from 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Serve pages directly
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/olms', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected successfully!"))
.catch(err => console.error("MongoDB connection error:", err));

// Helper function (optional, can remove if unused)
function isSuspicious(fromDate, toDate) {
  const days = (new Date(toDate) - new Date(fromDate)) / (1000*60*60*24);
  return days > 7;
}

// ✅ Catch-all 404 handler (after all routes)
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
