const express = require('express');
const router = express.Router();
const {
  createReservation,
  getAllReservations,
  getMyReservations,
  updateReservationStatus,
  updateReservation,
  deleteReservation,
} = require('../controllers/reservationController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/my', getMyReservations);

router.post('/', checkRole('CUSTOMER', 'MANAGER'), createReservation);

router.get('/', checkRole('MANAGER', 'STAFF'), getAllReservations);


router.put('/:id', checkRole('MANAGER'), updateReservation);

router.put('/:id/status', checkRole('MANAGER'), updateReservationStatus);

router.delete('/:id', checkRole('MANAGER'), deleteReservation);

module.exports = router;
