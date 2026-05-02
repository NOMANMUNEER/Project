const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const path = require('path');
// .env file parent folder mein hai, is liye path dena zaroori hai
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Models (Ab ye isi folder mein hain to path simple hoga)
const Quiz = require('./models/Quiz');
const Question = require('./models/Question');

const importData = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env file');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Create/Find Quiz
        let quiz = await Quiz.findOne({ title: 'Islamic Studies Preparation' });
        if (!quiz) {
            quiz = await Quiz.create({
                title: 'Islamic Studies Preparation',
                description: 'Complete Islamic Studies MCQs for FIA tests',
                category: 'Islamic Studies'
            });
            console.log('✅ New Quiz Category Created');
        }

        const results = [];
        const fileName = path.join(__dirname, 'islamic_mcqs.csv');

        if (!fs.existsSync(fileName)) {
            console.error(`❌ File not found: ${fileName}`);
            process.exit(1);
        }

        // CSV parsing with header cleaning
        fs.createReadStream(fileName)
            .pipe(csv({
                mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '') // BOM aur spaces saaf karne ke liye
            }))
            .on('data', (data) => {
                // Debug: Check if columns are being read
                if (results.length === 0) {
                    console.log('First Row Keys Found:', Object.keys(data));
                }

                // CSV columns mapping (ensure names match your CSV headers exactly)
                const questionText = data['questionText'];
                const opt0 = data['options[0]'];
                const opt1 = data['options[1]'];
                const opt2 = data['options[2]'];
                const opt3 = data['options[3]'];
                const correct = data['correctAnswer'];

                if (questionText && opt0 && opt1) {
                    results.push({
                        quiz: quiz._id,
                        questionText: questionText.trim(),
                        options: [opt0.trim(), opt1.trim(), opt2.trim(), opt3.trim()],
                        correctAnswer: correct ? correct.trim() : ''
                    });
                }
            })
            .on('end', async () => {
                console.log(`⏳ Processing ${results.length} valid questions...`);
                
                if (results.length === 0) {
                    console.log('❌ No valid data found. Check your CSV column headers.');
                    process.exit();
                }

                let successCount = 0;
                for (let q of results) {
                    try {
                        await Question.findOneAndUpdate(
                            { questionText: q.questionText, quiz: quiz._id },
                            q,
                            { upsert: true }
                        );
                        successCount++;
                    } catch (err) {
                        console.error('❌ Failed to save question:', q.questionText.substring(0, 30));
                    }
                }

                const finalCount = await Question.countDocuments({ quiz: quiz._id });
                quiz.totalQuestions = finalCount;
                await quiz.save();

                console.log(`✅ Success! ${successCount} new/updated questions. Total in DB: ${finalCount}`);
                process.exit();
            });

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

importData();