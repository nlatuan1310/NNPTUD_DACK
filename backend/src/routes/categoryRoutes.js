const express = require('express');
const router = express.Router();

const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Route: /api/v1/categories
router.route('/')
    .get(getCategories)
    .post(checkRole('MANAGER'), createCategory);

// Route: /api/v1/categories/:id
router.route('/:id')
    .get(getCategoryById)
    .put(checkRole('MANAGER'), updateCategory)
    .delete(checkRole('MANAGER'), deleteCategory);

module.exports = router;
