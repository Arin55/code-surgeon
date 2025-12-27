const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    contact: {
      phone: String,
      email: String,
    },
    services: [{ type: String }],
    image: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hospital', hospitalSchema);
