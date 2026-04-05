const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');


// POST /api/v1/auth/login - Đăng nhập
router.post('/login', login);

// GET /api/v1/auth/me - Lấy thông tin user hiện tại (cần JWT)
router.get('/me', verifyToken, getMe);

module.exports = router;
