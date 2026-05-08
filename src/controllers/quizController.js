const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const mongoose = require('mongoose');

// @desc    Get all quizzes with Search & Category filtering
// @route   GET /api/quizzes
exports.getQuizzes = async (req, res, next) => {
    try {
        const { category, search } = req.query;
        let query = {};

        if (category) {
            query.category = category;
        }

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const quizzes = await Quiz.find(query).populate('category', 'name');

        res.status(200).json({ 
            success: true, 
            count: quizzes.length, 
            data: quizzes 
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get quizzes by category with pagination
// @route   GET /api/categories/:categoryId/quizzes
exports.getQuizzesByCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const total = await Quiz.countDocuments({ category: categoryId });
        const quizzes = await Quiz.find({ category: categoryId })
                                  .populate('category', 'name')
                                  .skip(startIndex)
                                  .limit(limit);

        res.status(200).json({
            success: true,
            count: quizzes.length,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                totalQuizzes: total
            },
            data: quizzes
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single quiz details
// @route   GET /api/quizzes/:quizId
exports.getQuizDetails = async (req, res, next) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId).populate('category', 'name');
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }
        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        next(error);
    }
};

// @desc    Get random questions EXCLUDING correct answers
// @route   GET /api/quizzes/:quizId/questions
exports.getQuizQuestions = async (req, res, next) => {
    try {
        const quizId = req.params.quizId || req.params.id; // Support both :quizId and :id
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

        const limit = parseInt(req.query.limit) || 20; 

        const questions = await Question.aggregate([
            { $match: { quiz: quiz._id } },
            { $sample: { size: limit } }
        ]);

        res.status(200).json({ success: true, data: questions });
    } catch (error) {
        next(error);
    }
};

// @desc    Save pre-calculated score from client
// @route   POST /api/quizzes/:quizId/submit
exports.submitQuiz = async (req, res, next) => {
    try {
        const quizId = req.params.quizId || req.body.quizId;
        const { score, correctCount, totalQuestions } = req.body;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

        const attempt = await Attempt.create({
            user: req.user.id,
            quiz: quizId,
            category: quiz.category, // Save category for analytics
            score: score,
            totalQuestions: totalQuestions,
            correctAnswersCount: correctCount
        });

        res.status(201).json({
            success: true,
            message: 'Result saved successfully',
            score: score,
            correctAnswersCount: correctCount,
            totalQuestions: totalQuestions,
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
        const history = await Attempt.find({ user: req.user.id })
            .populate({
                path: 'quiz',
                select: 'title',
                populate: { path: 'category', select: 'name' }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (error) {
        next(error);
    }
};