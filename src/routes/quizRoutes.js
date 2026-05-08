const express = require('express');
const { 
    getQuizzes, 
    getQuizDetails, 
    getQuizQuestions, 
    submitQuiz 
} = require('../controllers/quizController');
const { protect } = require('../middlewares/authMiddleware');
const { checkQuizAccess } = require('../middlewares/quizAccessMiddleware');

const router = express.Router();

router.get('/', getQuizzes);
router.get('/:quizId', getQuizDetails);
router.get('/:quizId/questions', protect, checkQuizAccess, getQuizQuestions);
router.post('/:quizId/submit', protect, submitQuiz);
// Keep the old route temporarily for backward compatibility
router.post('/submit', protect, submitQuiz);

module.exports = router;