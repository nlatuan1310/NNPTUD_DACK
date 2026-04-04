const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /api/v1/auth/register  — Tạo tài khoản
router.post('/register', register);

// POST /api/v1/auth/login     — Đăng nhập, lấy JWT Token
router.post('/login', login);

module.exports = router;
