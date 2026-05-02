const express = require('express');
const { getQuizzes, getQuizQuestions, submitQuiz } = require('../controllers/quizController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getQuizzes);
router.get('/:id/questions', getQuizQuestions);
router.post('/submit', protect, submitQuiz);

module.exports = router;