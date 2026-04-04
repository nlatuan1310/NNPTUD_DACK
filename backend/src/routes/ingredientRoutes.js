const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');

// Tuyến đường cho CRUD Ingredient (Quản lý nguyên liệu)
router.get('/', ingredientController.getAllIngredients);
router.get('/:id', ingredientController.getIngredientById);
router.post('/', ingredientController.createIngredient);
router.put('/:id', ingredientController.updateIngredient);
router.delete('/:id', ingredientController.deleteIngredient);

module.exports = router;
