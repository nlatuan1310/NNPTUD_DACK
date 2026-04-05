const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Ưu tiên cấu hình dotenv của nhánh develop

const app = express();
const PORT = process.env.PORT || 5000;

// ======================== IMPORT ROUTES ========================
// Từ nhánh develop
const promotionRoutes = require('./routes/promotionRoutes');
const orderRoutes = require('./routes/orderRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');

// Từ nhánh của bạn (user-table-reservation)
const authRoutes = require('./routes/authRoutes');
const tableRoutes = require('./routes/tableRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const userRoutes = require('./routes/userRoutes');

// ======================== MIDDLEWARE ========================
// Ưu tiên toàn bộ cài đặt của nhánh develop
app.use(cors());
app.use(express.json()); // Để server hiểu được req.body dưới dạng JSON
app.use(express.urlencoded({ extended: true }));

// ======================== API ROUTES ========================
// Route của nhánh develop
app.use('/api/v1/promotions', promotionRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/invoices', invoiceRoutes);

// Route của nhánh bạn bổ sung vào
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tables', tableRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/users', userRoutes);

// ======================== CATCH ERROR & LISTEN ========================
// Test server đang chạy (branch develop)
app.get('/', (req, res) => {
  res.send('Restaurant Management System API is running...');
});

// Middleware xử lý lỗi 404 (Không tìm thấy route) - của branch develop
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Endpoint không tồn tại' });
});

// Middleware xử lý lỗi hệ thống (Của nhánh bạn - giữ lại để Server khỏi crash nếu lỗi logic)
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Bắt đầu server (theo format của branch develop)
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
