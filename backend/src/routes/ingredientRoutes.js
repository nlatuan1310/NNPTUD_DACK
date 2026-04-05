const express = require('express');
const router = express.Router();

const {
    getIngredients,
    getIngredientById,
    createIngredient,
    updateIngredient,
    deleteIngredient
} = require('../controllers/ingredientController');

// Route trung tâm: /api/v1/ingredients
router.route('/')
    .get(getIngredients)        // Xem danh sách nguyên liệu
    .post(createIngredient);    // Nhập nguyên liệu mới

// Route chi tiết: /api/v1/ingredients/:id
router.route('/:id')
    .get(getIngredientById)     // Xem chi tiết nguyên liệu
    .put(updateIngredient)      // Cập nhật nguyên liệu (số lượng, tên, đơn vị)
    .delete(deleteIngredient);  // Xóa nguyên liệu

module.exports = router;
