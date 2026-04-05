const express = require('express');
const router = express.Router();

const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

// @TODO: Sau này thêm middleware xác thực (authenticate) và phân quyền (authorizeManager) tại đây

// Route: /api/v1/categories
router.route('/')
    .get(getCategories)       // Lấy danh sách tất cả danh mục (Public)
    .post(createCategory);    // Tạo danh mục mới (Manager)

// Route: /api/v1/categories/:id
router.route('/:id')
    .get(getCategoryById)     // Lấy chi tiết 1 danh mục + danh sách món ăn của nó (Public)
    .put(updateCategory)      // Cập nhật danh mục (Manager)
    .delete(deleteCategory);  // Xóa danh mục (Manager)

module.exports = router;
