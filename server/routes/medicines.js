const express = require('express');
const { auth, admin } = require('../middleware/auth');
const { list, create, update, remove } = require('../controllers/medicineController');

const router = express.Router();

// Public listing for browsing medicines (auth optional in future)
router.get('/', list);

// Admin: create a medicine
router.post('/', [auth, admin], create);

// Admin: update a medicine
router.put('/:id', [auth, admin], update);

// Admin: delete a medicine
router.delete('/:id', [auth, admin], remove);

module.exports = { medicinesRouter: router };
