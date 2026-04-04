const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Tuyến đường cho CRUD Category
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
