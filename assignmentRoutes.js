const express = require('express');
const router = express.Router();
const { createAssignment, getAssignmentsByCourse, submitAssignment, gradeSubmission, getMySubmissions, getSubmissionsForAssignment } = require('../controllers/assignmentController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

// Student routes
router.get('/my', requireAuth, getMySubmissions);
router.get('/course/:courseId', requireAuth, getAssignmentsByCourse);
router.post('/:id/submit', requireAuth, submitAssignment);

// Instructor-only routes
router.post('/', requireAuth, requireRole('instructor', 'admin'), createAssignment);
router.get('/:id/submissions', requireAuth, requireRole('instructor', 'admin'), getSubmissionsForAssignment);
router.put('/submissions/:id/grade', requireAuth, requireRole('instructor', 'admin'), gradeSubmission);

module.exports = router;
