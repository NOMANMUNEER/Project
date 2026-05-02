const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');

// @desc    Get all quizzes with Search & Category filtering
// @route   GET /api/quizzes?category=Islamic&search=prophet
exports.getQuizzes = async (req, res, next) => {
    try {
        const { category, search } = req.query;
        let query = {};

        // 1. Category Filter: Agar category query mein hai
        if (category) {
            query.category = { $regex: category, $options: 'i' }; // 'i' means case-insensitive
        }

        // 2. Search Filter: Agar title mein kuch search karna ho
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const quizzes = await Quiz.find(query);

        res.status(200).json({ 
            success: true, 
            count: quizzes.length, 
            data: quizzes 
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get random questions WITH correct answers
exports.getQuizQuestions = async (req, res, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        const limit = parseInt(req.query.limit) || 20; 

        // Ab hum correctAnswer bhi saath bhej rahe hain
        const questions = await Question.aggregate([
            { $match: { quiz: quiz._id } },
            { $sample: { size: limit } }
            // $project mein correctAnswer ko 0 nahi kiya
        ]);

        res.status(200).json({ success: true, data: questions });
    } catch (error) {
        next(error);
    }
};

// @desc    Save pre-calculated score from client
exports.submitQuiz = async (req, res, next) => {
    try {
        // Ab client khud score bhej raha hai
        const { quizId, score, correctCount, totalQuestions } = req.body;

        const attempt = await Attempt.create({
            user: req.user.id,
            quiz: quizId,
            score: score, // e.g. 80
            totalQuestions: totalQuestions,
            correctAnswersCount: correctCount
        });

        res.status(201).json({
            success: true,
            message: 'Result saved successfully',
            attemptId: attempt._id
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get User Quiz History
// @route   GET /api/auth/history
exports.getUserHistory = async (req, res, next) => {
    try {
        // Sirf is logged-in user ki attempts nikalna aur quiz ka title bhi sath lana
        const history = await Attempt.find({ user: req.user.id })
            .populate('quiz', 'title category') // Quiz model se title aur category uthana
            .sort({ createdAt: -1 }); // Newest first

        res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (error) {
        next(error);
    }
};