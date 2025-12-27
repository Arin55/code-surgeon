const Order = require('../models/Order');

exports.list = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { patient: req.user.id };
    const items = await Order.find(filter)
      .populate('patient', 'name email')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { items, notes } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ msg: 'items required' });
    const order = await Order.create({ patient: req.user.id, items, notes: notes || undefined });
    res.status(201).json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: 'Not found' });
    if (status) order.status = status;
    if (notes) order.notes = notes;
    await order.save();
    res.json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Patient: cancel own order
exports.cancel = async (req, res) => {
  try {
    const id = req.params.id;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ msg: 'Not found' });
    // Only the patient who placed the order can cancel
    if (String(order.patient) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden' });
    }
    // Do not allow cancel if already terminal
    const terminal = ['Delivered','Rejected','Cancelled'];
    if (terminal.includes(order.status)) return res.status(400).json({ msg: 'Cannot cancel this order' });
    order.status = 'Cancelled';
    await order.save();
    res.json(order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};
