const express = require('express');
const router = express.Router();
const {
  createTable,
  getAllTables,
  updateTable,
  deleteTable,
} = require('../controllers/tableController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Tất cả routes đều yêu cầu đăng nhập
router.use(verifyToken);

// GET /api/v1/tables - Lấy danh sách bàn (tất cả user đã login)
router.get('/', getAllTables);

// POST /api/v1/tables - Tạo bàn mới (chỉ MANAGER)
router.post('/', checkRole('MANAGER'), createTable);

// PUT /api/v1/tables/:id - Cập nhật bàn (MANAGER, STAFF)
router.put('/:id', checkRole('MANAGER', 'STAFF'), updateTable);

// DELETE /api/v1/tables/:id - Xóa bàn (chỉ MANAGER)
router.delete('/:id', checkRole('MANAGER'), deleteTable);

module.exports = router;
