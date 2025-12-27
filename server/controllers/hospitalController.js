const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');

exports.list = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { 'address.city': { $regex: search, $options: 'i' } },
          { 'address.state': { $regex: search, $options: 'i' } },
          { services: { $in: [new RegExp(search, 'i')] } },
        ],
      };
    }
    const hospitals = await Hospital.find(query).sort({ createdAt: -1 }).limit(10);
    res.json(hospitals);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Patient: cancel own appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ msg: 'Appointment not found' });
    if (String(appt.patient) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden' });
    }
    if (['Cancelled','Rejected'].includes(appt.status)) {
      return res.status(400).json({ msg: 'Cannot cancel this appointment' });
    }
    appt.status = 'Cancelled';
    await appt.save();
    res.json(appt);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Admin: remove hospital
exports.removeHospital = async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await Hospital.findById(id);
    if (!doc) return res.status(404).json({ msg: 'Hospital not found' });
    await doc.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.get = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ msg: 'Hospital not found' });
    res.json(hospital);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Admin: create hospital
exports.createHospital = async (req, res) => {
  try {
    const { name, description, image, contact, services, address } = req.body;
    if (!name) return res.status(400).json({ msg: 'Name is required' });
    const doc = await Hospital.create({
      name,
      description: description || '',
      image: image || '',
      contact: contact || '',
      services: Array.isArray(services) ? services : (services ? String(services).split(',').map(s=>s.trim()).filter(Boolean) : []),
      address: { city: address?.city || '', state: address?.state || '' },
    });
    res.status(201).json(doc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const { service, date, time, notes } = req.body;
    const appt = await Appointment.create({
      patient: req.user.id,
      hospital: req.params.id,
      service,
      date: date || undefined,
      time: time || undefined,
      notes,
    });
    res.json(appt);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role !== 'admin') filter.patient = req.user.id;
    const appts = await Appointment.find(filter)
      .populate('patient', 'name email phone')
      .populate('hospital', 'name');
    res.json(appts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status, date, time } = req.body;
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ msg: 'Appointment not found' });
    if (status) appt.status = status;
    if (date) appt.date = date;
    if (time) appt.time = time;
    await appt.save();
    res.json(appt);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Server error' });
  }
};
