const express = require('express');
const router = express.Router();

const {
    getFoods,
    getFoodById,
    createFood,
    updateFood,
    deleteFood
} = require('../controllers/foodController');

// @TODO: Gắn các Middleware chặn quyền (Admin / Manager) vào các phương thức POST, PUT, DELETE sau

// Route: /api/v1/foods
router.route('/')
    .get(getFoods)        // Lấy danh sách (Public)
    .post(createFood);    // Tạo món ăn (Manager)

// Route: /api/v1/foods/:id
router.route('/:id')
    .get(getFoodById)     // Xem chi tiết (Public)
    .put(updateFood)      // Sửa món ăn (Manager)
    .delete(deleteFood);  // Xóa món ăn (Manager)

module.exports = router;
