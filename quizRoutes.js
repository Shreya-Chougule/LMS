const express = require('express');
const router = express.Router();
const { createQuiz, addQuestions, getQuiz, getQuizzesByCourse, submitQuiz, getMyQuizResults } = require('../controllers/quizController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

// Student routes
router.get('/results/my', requireAuth, getMyQuizResults);
router.get('/:id', requireAuth, getQuiz);
router.get('/course/:courseId', requireAuth, getQuizzesByCourse);
router.post('/:id/submit', requireAuth, submitQuiz);

// Instructor-only routes
router.post('/', requireAuth, requireRole('instructor', 'admin'), createQuiz);
router.post('/:id/questions', requireAuth, requireRole('instructor', 'admin'), addQuestions);

module.exports = router;
