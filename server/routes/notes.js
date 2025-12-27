const express = require('express');
const { auth, admin } = require('../middleware/auth');
const { list, create, createSelf } = require('../controllers/noteController');

const router = express.Router();

// List notes/reminders (patient sees own; admin can pass ?patientId=...)
router.get('/', auth, list);

// Admin create a note/reminder for a patient
router.post('/', [auth, admin], create);

// Patient creates their own medicine reminder
router.post('/reminders', auth, createSelf);

module.exports = { notesRouter: router };
