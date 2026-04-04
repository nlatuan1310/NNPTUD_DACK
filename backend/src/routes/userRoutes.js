const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Tất cả routes đều yêu cầu đăng nhập
router.use(verifyToken);

// GET /api/v1/users - Lấy danh sách users (MANAGER, STAFF)
// Lưu ý: controller xử lý logic STAFF chỉ thấy CUSTOMER
router.get('/', checkRole('MANAGER', 'STAFF'), getAllUsers);

// POST /api/v1/users - Tạo user mới / nhân viên mới (Chỉ MANAGER)
router.post('/', checkRole('MANAGER'), createUser);

// PUT /api/v1/users/:id - Cập nhật thông tin person (Chỉ MANAGER)
router.put('/:id', checkRole('MANAGER'), updateUser);

// DELETE /api/v1/users/:id - Xóa người dùng (Chỉ MANAGER)
router.delete('/:id', checkRole('MANAGER'), deleteUser);

module.exports = router;
