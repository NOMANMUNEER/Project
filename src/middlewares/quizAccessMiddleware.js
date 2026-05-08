const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');

/**
 * Middleware: Check if user can access quiz questions
 * - Premium & Admin: unlimited access
 * - Free users: 1 quiz per category per day
 */
exports.checkQuizAccess = async (req, res, next) => {
    try {
        // Admin and premium users get unlimited access
        if (req.user.role === 'admin' || req.user.role === 'premium') {
            return next();
        }

        // Get the quiz to find its category
        const quizId = req.params.quizId || req.params.id;
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        // Calculate start of today (midnight)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count how many quizzes this user attempted today in this category
        const attemptsToday = await Attempt.countDocuments({
            user: req.user.id,
            category: quiz.category,
            createdAt: { $gte: today }
        });

        if (attemptsToday >= 1) {
            return res.status(403).json({
                success: false,
                message: 'Free users can only attempt 1 quiz per category per day. Upgrade to Premium for unlimited access.',
                upgradeRequired: true
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};
