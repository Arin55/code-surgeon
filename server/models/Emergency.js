const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    phone: String,
    message: String,
    status: { type: String, enum: ['New', 'Seen', 'Resolved'], default: 'New' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Emergency', emergencySchema);
