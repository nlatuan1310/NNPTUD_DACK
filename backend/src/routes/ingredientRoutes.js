const express = require('express');
const router = express.Router();

const {
    getIngredients,
    getIngredientById,
    createIngredient,
    updateIngredient,
    deleteIngredient
} = require('../controllers/ingredientController');

const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Route trung tâm: /api/v1/ingredients
router.route('/')
    .get(getIngredients)
    .post(checkRole('MANAGER'), createIngredient);

// Route chi tiết: /api/v1/ingredients/:id
router.route('/:id')
    .get(getIngredientById)
    .put(checkRole('MANAGER'), updateIngredient)
    .delete(checkRole('MANAGER'), deleteIngredient);

module.exports = router;
