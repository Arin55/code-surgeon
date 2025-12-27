const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin
    fileName: String,
    originalName: String,
    mimeType: String,
    path: String,
    type: { type: String, enum: ['Blood Test','X-ray','MRI','Prescription','Other'], default: 'Other' },
    summary: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
