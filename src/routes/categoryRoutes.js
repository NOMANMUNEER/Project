const express = require('express');
const { getCategories, createCategory } = require('../controllers/categoryController');
const { getQuizzesByCategory } = require('../controllers/quizController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
    .get(getCategories)
    .post(protect, authorize('admin'), createCategory);

router.get('/:categoryId/quizzes', getQuizzesByCategory);

module.exports = router;
