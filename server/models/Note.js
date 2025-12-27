const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin
    text: { type: String, required: true },
    type: { type: String, enum: ['note', 'reminder'], default: 'note' },
    dueAt: { type: Date },
    // medicine reminder fields (optional)
    medicineName: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    timeOfDay: { type: String }, // HH:MM 24h
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
