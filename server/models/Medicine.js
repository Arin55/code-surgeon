const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    unit: { type: String, default: 'strip' },
    stock: { type: Number, default: 100 },
    image: { type: String, default: '' },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medicine', medicineSchema);
