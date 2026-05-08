const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const path = require('path');

// Ensure correct path to .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Category = require('./models/Category');
const Quiz = require('./models/Quiz');
const Question = require('./models/Question');
const Attempt = require('./models/Attempt');

const filesToImport = [
    {
        filename: 'GK_mcqs.csv',
        categoryName: 'General Knowledge',
        description: 'General Knowledge (GK) MCQs for FIA, CSS, and NTS Test Preparation',
        quizPrefix: 'GK Mock Test'
    },
    {
        filename: 'english_mcqs.csv',
        categoryName: 'English',
        description: 'English MCQs including grammar, vocabulary, and comprehension',
        quizPrefix: 'English Mock Test'
    },
    {
        filename: 'islamic_mcqs.csv',
        categoryName: 'Islamic Studies',
        description: 'Islamic Studies MCQs for general preparation',
        quizPrefix: 'Islamic Studies Mock Test'
    }
];

const CHUNK_SIZE = 20; // Number of questions per quiz

const processFile = (fileInfo) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, fileInfo.filename);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Warning: File not found: ${filePath}`);
            return resolve([]);
        }

        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv({
                mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '') // Clean BOM
            }))
            .on('data', (data) => {
                const questionText = data['questionText'];
                const opt0 = data['options[0]'];
                const opt1 = data['options[1]'];
                const opt2 = data['options[2]'];
                const opt3 = data['options[3]'];
                const correct = data['correctAnswer'];

                if (questionText && opt0 && opt1 && correct) {
                    results.push({
                        questionText: questionText.trim(),
                        options: [opt0.trim(), opt1.trim(), opt2.trim(), opt3.trim()].filter(Boolean),
                        correctAnswer: correct.trim()
                    });
                }
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

const importData = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env file');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Wipe the database collections
        console.log('🗑️ Wiping existing data (Categories, Quizzes, Questions, Attempts)...');
        await Category.deleteMany({});
        await Quiz.deleteMany({});
        await Question.deleteMany({});
        await Attempt.deleteMany({});
        console.log('✅ Database cleared!');

        // 2. Process each file
        for (const fileInfo of filesToImport) {
            console.log(`\n📂 Processing: ${fileInfo.filename}...`);
            
            const questionsData = await processFile(fileInfo);
            if (questionsData.length === 0) continue;

            console.log(`📝 Found ${questionsData.length} valid questions in ${fileInfo.filename}`);

            // 3. Create Category
            const category = await Category.create({
                name: fileInfo.categoryName,
                description: fileInfo.description
            });
            console.log(`✅ Created Category: ${category.name}`);

            // 4. Chunk questions and create Quizzes
            let quizCounter = 1;
            for (let i = 0; i < questionsData.length; i += CHUNK_SIZE) {
                const chunk = questionsData.slice(i, i + CHUNK_SIZE);

                // Create Quiz
                const quiz = await Quiz.create({
                    title: `${fileInfo.quizPrefix} ${quizCounter}`,
                    description: `Practice test ${quizCounter} for ${fileInfo.categoryName}`,
                    category: category._id,
                    totalQuestions: chunk.length
                });

                // Attach references to chunked questions
                const questionsToInsert = chunk.map(q => ({
                    ...q,
                    quiz: quiz._id,
                    category: category._id
                }));

                // Bulk insert Questions for this Quiz
                await Question.insertMany(questionsToInsert);
                
                quizCounter++;
            }
            console.log(`✅ Created ${quizCounter - 1} Quizzes for ${category.name} (Total Questions: ${questionsData.length})`);
        }

        console.log('\n🎉 Data Migration and Reseeding completed successfully!');
        process.exit();

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

importData();