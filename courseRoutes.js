const express = require('express');
const router = express.Router();
const { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse, getCourseModules, createModule } = require('../controllers/courseController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', getAllCourses);
router.get('/:id', getCourseById);

// Module routes
router.get('/:id/modules', requireAuth, requireRole('instructor', 'admin'), getCourseModules);
router.post('/:id/modules', requireAuth, requireRole('instructor', 'admin'), createModule);

// Instructor-only routes
router.post('/', requireAuth, requireRole('instructor', 'admin'), createCourse);
router.put('/:id', requireAuth, requireRole('instructor', 'admin'), updateCourse);
router.delete('/:id', requireAuth, requireRole('instructor', 'admin'), deleteCourse);

module.exports = router;
