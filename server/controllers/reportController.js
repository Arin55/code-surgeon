const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');

exports.list = async (req, res) => {
  try {
    const { q, from, to } = req.query;
    const filter = req.user.role === 'admin' ? {} : { patient: req.user.id };
    // name search
    if (q) filter.$or = [
      { originalName: { $regex: q, $options: 'i' } },
      { fileName: { $regex: q, $options: 'i' } },
    ];
    // date range (createdAt)
    if (from || to){
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to); end.setHours(23,59,59,999); filter.createdAt.$lte = end;
      }
    }
    const items = await Report.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'File required' });
    const { patientId, hospitalId } = req.body;
    // naive type detection
    const name = (req.file.originalname || '').toLowerCase();
    const mime = (req.file.mimetype || '').toLowerCase();
    const detect = () => {
      if (name.includes('blood') || name.includes('cbc')) return 'Blood Test';
      if (name.includes('xray') || name.includes('x-ray') || mime.includes('x-ray')) return 'X-ray';
      if (name.includes('mri')) return 'MRI';
      if (name.includes('rx') || name.includes('prescription')) return 'Prescription';
      return 'Other';
    };
    const report = await Report.create({
      patient: patientId,
      hospital: hospitalId || undefined,
      uploadedBy: req.user.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      path: `/uploads/reports/${req.file.filename}`,
      type: detect(),
      summary: '',
    });
    res.status(201).json(report);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.download = async (req, res) => {
  try {
    const doc = await Report.findById(req.params.id);
    if (!doc) return res.status(404).json({ msg: 'Not found' });
    // permission: patient owner or admin
    if (!(req.user.role === 'admin' || String(doc.patient) === req.user.id)) {
      return res.status(403).json({ msg: 'Forbidden' });
    }
    const filePath = path.join(__dirname, '..', '..', doc.path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ msg: 'File missing' });
    res.download(filePath, doc.originalName || doc.fileName);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

// DELETE /api/reports/:id (admin only)
exports.remove = async (req, res) => {
  try {
    const doc = await Report.findById(req.params.id);
    if (!doc) return res.status(404).json({ msg: 'Not found' });
    // delete physical file if exists
    const filePath = path.join(__dirname, '..', '..', doc.path || '');
    try{ if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
    await doc.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};
