const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    questionText: { type: String, required: true },
    options: { type: [String], required: true },
    // 'select: false' removed to allow client-side checking as requested
    correctAnswer: { 
        type: String, 
        required: true
    }
});

module.exports = mongoose.model('Question', questionSchema);