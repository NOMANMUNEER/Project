const Quiz = require('../models/Quiz');
const Question = require('../models/Question');

// @desc    Create a new Quiz
// @route   POST /api/admin/quiz
exports.createQuiz = async (req, res, next) => {
    try {
        const quiz = await Quiz.create(req.body);
        res.status(201).json({ success: true, data: quiz });
    } catch (error) {
        next(error);
    }
};

// @desc    Add a Question to a Quiz
// @route   POST /api/admin/question
exports.addQuestion = async (req, res, next) => {
    try {
        const { quizId, questionText, options, correctAnswer } = req.body;

        // Check if quiz exists
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        const question = await Question.create({
            quiz: quizId,
            category: quiz.category, // Assign category from quiz for future random mock tests
            questionText,
            options,
            correctAnswer
        });

        // Update total questions count in Quiz model
        quiz.totalQuestions += 1;
        await quiz.save();

        res.status(201).json({ success: true, data: question });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a Question
// @route   DELETE /api/admin/question/:id
exports.deleteQuestion = async (req, res, next) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: 'Question not found' });

        // Update quiz count
        const quiz = await Quiz.findById(question.quiz);
        if (quiz) {
            quiz.totalQuestions -= 1;
            await quiz.save();
        }

        await question.deleteOne();
        res.status(200).json({ success: true, message: 'Question deleted' });
    } catch (error) {
        next(error);
    }
};