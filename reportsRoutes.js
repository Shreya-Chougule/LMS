const express = require('express');
const router = express.Router();
const { submitReport, getReports, updateReport } = require('../controllers/reportsController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

// Any logged-in user can submit a report
router.post('/', requireAuth, submitReport);

// Admin only
router.get('/', requireAuth, requireRole('admin'), getReports);
router.put('/:id', requireAuth, requireRole('admin'), updateReport);

module.exports = router;
