const express = require('express');
const { create, list, update } = require('../controllers/emergencyController');
const { optionalAuth, auth, admin } = require('../middleware/auth');

const router = express.Router();

// Public/optional auth create so logged-out users can also send alerts
router.post('/', optionalAuth, create);

// Auth required to list own alerts; admin sees all
router.get('/', auth, list);

// Admin can update status
router.put('/:id', [auth, admin], update);

module.exports = { emergencyRouter: router };
