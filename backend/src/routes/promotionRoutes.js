const express = require('express');
const router = express.Router();
const { 
    getPromotions, 
    createPromotion, 
    validatePromotion, 
    updatePromotion 
} = require('../controllers/promotionController');

// @TODO: Sau này thêm middleware check Auth/Role tại đây để bảo vệ Endpoint

router.route('/')
    .get(getPromotions)
    .post(createPromotion); // Cần Middleware Admin/Manager

router.route('/:code/validate')
    .get(validatePromotion);

router.route('/:id')
    .put(updatePromotion); // Cần Middleware Admin/Manager

module.exports = router;
