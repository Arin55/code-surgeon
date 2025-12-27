const express = require('express');
const { check } = require('express-validator');
const {
  list,
  get,
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  createHospital,
  removeHospital,
  cancelAppointment,
} = require('../controllers/hospitalController');
const { auth, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', list);
router.get('/:id', get);

// Admin: add hospital
router.post('/', [auth, admin], createHospital);

// Admin: delete hospital
router.delete('/:id', [auth, admin], removeHospital);

router.post(
  '/:id/appointments',
  [auth, [check('service', 'Service is required').notEmpty()]],
  createAppointment
);

router.get('/appointments/all', [auth], getAppointments);
router.put('/appointments/:id', [auth, admin], updateAppointmentStatus);
router.patch('/appointments/:id/cancel', [auth], cancelAppointment);

module.exports = { hospitalsRouter: router };
