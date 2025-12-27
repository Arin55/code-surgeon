const express = require('express');
const { check } = require('express-validator');
const { register, login, me, updateMe } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Valid email required').isEmail(),
    check('password', 'Min 6 chars').isLength({ min: 6 }),
  ],
  register
);

router.post(
  '/login',
  [check('email', 'Valid email required').isEmail(), check('password', 'Password required').notEmpty()],
  login
);

router.get('/me', auth, me);
router.put('/me', auth, updateMe);

module.exports = { authRouter: router };
