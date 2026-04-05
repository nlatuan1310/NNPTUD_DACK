const express = require('express');
const router = express.Router();
const {
  createReservation,
  getAllReservations,

  updateReservationStatus,
  updateReservation,
  deleteReservation,
} = require('../controllers/reservationController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/', checkRole('MANAGER', 'STAFF'), createReservation);

router.get('/', checkRole('MANAGER', 'STAFF'), getAllReservations);

router.put('/:id', checkRole('MANAGER'), updateReservation);

router.put('/:id/status', checkRole('MANAGER'), updateReservationStatus);

router.delete('/:id', checkRole('MANAGER'), deleteReservation);

module.exports = router;
