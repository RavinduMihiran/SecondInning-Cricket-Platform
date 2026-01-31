const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 8 characters')
      .isLength({ min: 8 })
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/)
      .withMessage('Password must contain at least one number, one uppercase and one lowercase letter'),
    check('role', 'Role is required').isIn(['player', 'coach', 'scout', 'admin', 'parent'])
  ],
  authController.register
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  authController.login
);

// @route   GET api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, authController.getCurrentUser);

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  [
    auth,
    check('name', 'Name cannot be empty').optional().not().isEmpty(),
    check('phone', 'Please provide a valid phone number').optional().isMobilePhone(),
    check('dateOfBirth', 'Date of birth must be a valid date').optional().isDate()
  ],
  authController.updateProfile
);

// @route   PUT api/auth/change-password
// @desc    Change user password
// @access  Private
router.put(
  '/change-password',
  [
    auth,
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'New password must be at least 8 characters')
      .isLength({ min: 8 })
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/)
      .withMessage('Password must contain at least one number, one uppercase and one lowercase letter')
  ],
  authController.changePassword
);

// @route   POST api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, authController.logout);

module.exports = router; 