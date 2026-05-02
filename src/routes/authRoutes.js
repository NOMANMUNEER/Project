const express = require('express');
const { signup, login, getUserHistory } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/history', protect, getUserHistory);

module.exports = router;