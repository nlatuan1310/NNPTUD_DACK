const express = require('express');
const router = express.Router();
const {
    checkout,
    confirmPayment,
    deleteInvoice
} = require('../controllers/invoiceController');

// @TODO: Gắn Middleware Role/Auth (Đặc biệt chặn các Quyền xoá)

router.route('/checkout')
    .post(checkout);

router.route('/:id/pay')
    .put(confirmPayment);

router.route('/:id')
    .delete(deleteInvoice); // Cần gắn Roll CHECK MANAGER SAU NÀY

module.exports = router;
