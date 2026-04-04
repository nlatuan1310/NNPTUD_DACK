const express = require('express');
const router = express.Router();
const {
  createReservation,
  getAllReservations,
  getMyReservations,
  updateReservationStatus,
} = require('../controllers/reservationController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Tất cả routes đều yêu cầu đăng nhập
router.use(verifyToken);

// GET /api/v1/reservations/my - Lịch sử đặt bàn của khách hàng
// (Đặt TRƯỚC route /:id để tránh Express hiểu "my" là :id)
router.get('/my', getMyReservations);

// POST /api/v1/reservations - Tạo đặt bàn (CUSTOMER, STAFF)
router.post('/', checkRole('CUSTOMER', 'STAFF'), createReservation);

// GET /api/v1/reservations - Xem tất cả đặt bàn (MANAGER, STAFF)
router.get('/', checkRole('MANAGER', 'STAFF'), getAllReservations);

// PUT /api/v1/reservations/:id/status - Cập nhật trạng thái (MANAGER, STAFF)
router.put('/:id/status', checkRole('MANAGER', 'STAFF'), updateReservationStatus);

module.exports = router;
