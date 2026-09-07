const express = require('express');
const router = express.Router();
const { getPlatformStats, getAllUsers, updateUser, deleteUser, getAllEnrollments, getAllCoursesAdmin } = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

// All admin routes require auth + admin role
router.use(requireAuth, requireRole('admin'));

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/enrollments', getAllEnrollments);
router.get('/courses', getAllCoursesAdmin);

module.exports = router;
