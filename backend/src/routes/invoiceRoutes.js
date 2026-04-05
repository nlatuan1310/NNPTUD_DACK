const express = require('express');
const router = express.Router();
const {
    checkout,
    confirmPayment,
    deleteInvoice,
    refundInvoice
} = require('../controllers/invoiceController');

const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.route('/checkout')
    .post(checkRole('MANAGER', 'STAFF'), checkout);

router.route('/:id/pay')
    .put(checkRole('MANAGER', 'STAFF'), confirmPayment);

router.route('/:id/refund')
    .put(checkRole('MANAGER'), refundInvoice);

router.route('/:id')
    .delete(checkRole('MANAGER'), deleteInvoice);

module.exports = router;
