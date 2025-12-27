const express = require('express');
const { auth, admin } = require('../middleware/auth');
const { list, create, update, cancel } = require('../controllers/orderController');

const router = express.Router();

router.get('/', auth, list);
router.post('/', auth, create);
router.put('/:id', [auth, admin], update);
router.patch('/:id/cancel', auth, cancel);

module.exports = { ordersRouter: router };
