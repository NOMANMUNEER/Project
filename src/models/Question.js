const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    questionText: { type: String, required: true },
    options: { type: [String], required: true },
    // 'select: false' hata diya taake client-side checking ho sakay
    correctAnswer: { 
        type: String, 
        required: true 
    }
});

module.exports = mongoose.model('Question', questionSchema);