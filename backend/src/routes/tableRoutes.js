const express = require('express');
const router = express.Router();
const {
  createTable,
  getAllTables,
  updateTable,
  deleteTable,
} = require('../controllers/tableController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', getAllTables);

router.post('/', checkRole('MANAGER'), createTable);

router.put('/:id', checkRole('MANAGER'), updateTable);

router.delete('/:id', checkRole('MANAGER'), deleteTable);

module.exports = router;
