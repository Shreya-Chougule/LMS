const express = require('express');
const router = express.Router();
const { enrollInCourse, getMyEnrollments, updateProgress, getCourseProgress, getInstructorEnrollments, getInstructorAnalytics } = require('../controllers/enrollmentController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

// All enrollment routes require authentication
router.post('/', requireAuth, enrollInCourse);
router.get('/my', requireAuth, getMyEnrollments);
router.get('/instructor', requireAuth, requireRole('instructor', 'admin'), getInstructorEnrollments);
router.get('/instructor/analytics', requireAuth, requireRole('instructor', 'admin'), getInstructorAnalytics);
router.post('/progress', requireAuth, updateProgress);
router.get('/progress/:courseId', requireAuth, getCourseProgress);

module.exports = router;
