const express = require('express');
const router = express.Router();
const { 
    getPromotions, 
    createPromotion, 
    validatePromotion, 
    updatePromotion 
} = require('../controllers/promotionController');

const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.route('/')
    .get(getPromotions)
    .post(checkRole('MANAGER'), createPromotion);

router.route('/:code/validate')
    .get(validatePromotion);

router.route('/:id')
    .put(checkRole('MANAGER'), updatePromotion);

module.exports = router;
