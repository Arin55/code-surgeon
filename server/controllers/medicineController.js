const Medicine = require('../models/Medicine');

exports.list = async (req, res) => {
  try {
    const { q } = req.query;
    let filter = {};
    if (q) {
      filter = { name: { $regex: q, $options: 'i' } };
    }
    const meds = await Medicine.find(filter).sort({ name: 1 }).limit(10);
    res.json(meds);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Admin: create medicine
exports.create = async (req, res) => {
  try {
    const { name, description, price, unit, stock, image, rating } = req.body;
    if (!name) return res.status(400).json({ msg: 'Name is required' });
    const doc = await Medicine.create({
      name,
      description: description || '',
      price: price ?? 0,
      unit: unit || 'unit',
      stock: stock ?? 0,
      image: image || '',
      rating: rating ?? 0,
    });
    res.status(201).json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Admin: update medicine
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const m = await Medicine.findById(id);
    if (!m) return res.status(404).json({ msg: 'Medicine not found' });
    const { name, description, price, unit, stock, image, rating } = req.body;
    if (name !== undefined) m.name = name;
    if (description !== undefined) m.description = description;
    if (price !== undefined) m.price = price;
    if (unit !== undefined) m.unit = unit;
    if (stock !== undefined) m.stock = stock;
    if (image !== undefined) m.image = image;
    if (rating !== undefined) m.rating = rating;
    await m.save();
    res.json(m);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Admin: delete medicine
exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    const m = await Medicine.findById(id);
    if (!m) return res.status(404).json({ msg: 'Medicine not found' });
    await m.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};
