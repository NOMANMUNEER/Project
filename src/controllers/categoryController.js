const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Admin
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Please add a category name' });
        }

        const category = await Category.create({ name, description });

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
