const express = require('express');
const router = express.Router();

const {
    getFoods,
    getFoodById,
    createFood,
    updateFood,
    deleteFood
} = require('../controllers/foodController');

const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Route: /api/v1/foods
router.route('/')
    .get(getFoods)
    .post(checkRole('MANAGER'), createFood);

// Route: /api/v1/foods/:id
router.route('/:id')
    .get(getFoodById)
    .put(checkRole('MANAGER'), updateFood)
    .delete(checkRole('MANAGER'), deleteFood);

module.exports = router;
