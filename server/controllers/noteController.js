const Note = require('../models/Note');

exports.list = async (req, res) => {
  try {
    const { patientId } = req.query;
    let filter = {};
    if (req.user.role === 'admin' && patientId) filter.patient = patientId;
    else filter.patient = req.user.id;
    const items = await Note.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { patientId, text, type, dueAt } = req.body;
    if (!patientId || !text) return res.status(400).json({ msg: 'patientId and text required' });
    const note = await Note.create({ patient: patientId, createdBy: req.user.id, text, type: type || 'note', dueAt: dueAt || undefined });
    res.status(201).json(note);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Patient creates their own medicine reminder
exports.createSelf = async (req, res) => {
  try {
    const { medicineName, startDate, endDate, timeOfDay, text } = req.body;
    if (!medicineName || !startDate || !timeOfDay) {
      return res.status(400).json({ msg: 'medicineName, startDate and timeOfDay are required' });
    }
    const payload = {
      patient: req.user.id,
      createdBy: req.user.id,
      type: 'reminder',
      text: text || `Take ${medicineName}`,
      medicineName,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      timeOfDay,
      dueAt: startDate ? new Date(startDate) : undefined,
    };
    const note = await Note.create(payload);
    res.status(201).json(note);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};
