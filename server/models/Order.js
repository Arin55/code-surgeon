const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{ name: String, qty: Number }],
    status: { type: String, enum: ['Placed', 'Processing', 'Ready', 'Delivered', 'Rejected'], default: 'Placed' },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
