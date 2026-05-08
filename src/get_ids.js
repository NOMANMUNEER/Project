const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Category = require('./models/Category');
const Quiz = require('./models/Quiz');

const getSampleData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const category = await Category.findOne({ name: 'General Knowledge' });
        const quiz = await Quiz.findOne({ category: category._id });

        console.log('\n--- SAMPLE IDs FOR POSTMAN ---');
        console.log(`CATEGORY_ID: ${category._id}`);
        console.log(`QUIZ_ID: ${quiz._id}`);
        console.log('------------------------------\n');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

getSampleData();
