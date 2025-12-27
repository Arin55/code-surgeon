const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
    type: { type: String, enum: ['Ayushman Bharat','Government','Private Insurance'], required: true },
    reason: { type: String, default: '' },
    status: { type: String, enum: ['Pending','Approved','Rejected'], default: 'Pending' },
    adminRemarks: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Claim', claimSchema);
