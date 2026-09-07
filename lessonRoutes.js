const express = require('express');
const router = express.Router();
const { createLesson, getLessons, updateLesson, deleteLesson } = require('../controllers/lessonController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

// Get lessons for a course (public — used by course details page)
router.get('/', getLessons);

// Instructor-only routes
router.post('/', requireAuth, requireRole('instructor', 'admin'), createLesson);
router.put('/:id', requireAuth, requireRole('instructor', 'admin'), updateLesson);
router.delete('/:id', requireAuth, requireRole('instructor', 'admin'), deleteLesson);

module.exports = router;
