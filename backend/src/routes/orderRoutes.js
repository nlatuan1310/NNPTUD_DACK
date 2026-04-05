const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    addOrderItem,
    updateOrderItem,
    removeOrderItem
} = require('../controllers/orderController');

const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.use(checkRole('MANAGER', 'STAFF'));
router.route('/')
    .get(getOrders)
    .post(createOrder);

router.route('/:id')
    .get(getOrderById);

router.route('/:id/status')
    .put(updateOrderStatus);

router.route('/:orderId/items')
    .post(addOrderItem);

router.route('/items/:itemId')
    .put(updateOrderItem)
    .delete(removeOrderItem);

// Lỗi 404 cho các route không tồn tại trong order
router.use('(.*)', (req, res) => {
    res.status(404).json({ success: false, message: 'Order Route không tồn tại' });
});

module.exports = router;
