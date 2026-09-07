const express = require('express');
const router = express.Router();
const { generateCertificate, getMyCertificates, verifyCertificate } = require('../controllers/certificateController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Public route
router.get('/verify/:certNumber', verifyCertificate);

// Authenticated routes
router.get('/my', requireAuth, getMyCertificates);
router.post('/', requireAuth, generateCertificate);

module.exports = router;
