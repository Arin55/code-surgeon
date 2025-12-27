const express = require('express');
const cors = require('cors');
const path = require('path');

const { authRouter } = require('./routes/auth');
const { hospitalsRouter } = require('./routes/hospitals');
const { emergencyRouter } = require('./routes/emergency');
const { reportsRouter } = require('./routes/reports');
const { ordersRouter } = require('./routes/orders');
const { notesRouter } = require('./routes/notes');
const { medicinesRouter } = require('./routes/medicines');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/hospitals', hospitalsRouter);
app.use('/api/emergency', emergencyRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/notes', notesRouter);
app.use('/api/medicines', medicinesRouter);

// serve uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve client as static (for simple dev)
app.use(express.static(path.join(__dirname, '..', 'client')));

// 404 handler
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ msg: 'API route not found' });
  next();
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ msg: 'Server error' });
});

module.exports = app;
