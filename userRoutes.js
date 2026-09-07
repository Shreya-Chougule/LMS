const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUserById } = require('../controllers/userController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Authenticated routes
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);

// Public route
router.get('/:id', getUserById);

module.exports = router;
