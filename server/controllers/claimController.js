const Claim = require('../models/Claim');
const Report = require('../models/Report');

// List claims (admin sees all, patient sees own)
exports.list = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { patient: req.user.id };
    const items = await Claim.find(filter)
      .populate('patient', 'name email')
      .populate('hospital', 'name')
      .populate('report', 'originalName fileName')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Create claim (patient)
exports.create = async (req, res) => {
  try {
    const { reportId, hospitalId, type, reason } = req.body;
    if (!reportId || !hospitalId || !type) return res.status(400).json({ msg: 'Missing fields' });
    // ensure the report belongs to the patient
    const rpt = await Report.findById(reportId);
    if (!rpt) return res.status(404).json({ msg: 'Report not found' });
    if (String(rpt.patient) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden' });
    }
    const doc = await Claim.create({
      patient: req.user.id,
      report: reportId,
      hospital: hospitalId,
      type,
      reason: reason || '',
    });
    res.status(201).json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Update claim (admin only)
exports.update = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    const c = await Claim.findById(req.params.id);
    if (!c) return res.status(404).json({ msg: 'Not found' });
    if (status) c.status = status;
    if (adminRemarks !== undefined) c.adminRemarks = adminRemarks;
    await c.save();
    res.json(c);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};
