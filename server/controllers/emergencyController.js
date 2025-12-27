const Emergency = require('../models/Emergency');

// POST /api/emergency
exports.create = async (req, res) => {
  try {
    const { name, phone, message } = req.body;
    const payload = {
      name: name || undefined,
      phone: phone || undefined,
      message: message || undefined,
    };
    if (req.user?.id) payload.user = req.user.id;
    const emg = await Emergency.create(payload);
    res.status(201).json(emg);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

// GET /api/emergency (admin sees all, patient sees own)
exports.list = async (req, res) => {
  try {
    let filter = {};
    if (req.user?.role !== 'admin') filter.user = req.user?.id || null;
    const items = await Emergency.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

// PUT /api/emergency/:id (admin only)
exports.update = async (req, res) => {
  try {
    const { status } = req.body;
    const emg = await Emergency.findById(req.params.id);
    if (!emg) return res.status(404).json({ msg: 'Not found' });
    if (status) emg.status = status;
    await emg.save();
    res.json(emg);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};
