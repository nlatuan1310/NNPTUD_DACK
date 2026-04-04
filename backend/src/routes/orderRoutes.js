const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus
} = require('../controllers/orderController');

// @TODO: Gắn Middleware xác thực (Auth) ở đây sau khi làm xong Authen

router.route('/')
    .get(getOrders)
    .post(createOrder);

router.route('/:id')
    .get(getOrderById);

router.route('/:id/status')
    .put(updateOrderStatus);

// Lỗi 404 cho các route không tồn tại trong order
router.use('*', (req, res) => {
    res.status(404).json({ success: false, message: 'Order Route không tồn tại' });
});

module.exports = router;
