const express = require('express');
const { createQuiz, addQuestion, deleteQuestion } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes below this line will require Login and Admin Role
router.use(protect);
router.use(authorize('admin'));

router.post('/quiz', createQuiz);
router.post('/question', addQuestion);
router.delete('/question/:id', deleteQuestion);

module.exports = router;