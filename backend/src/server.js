const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Các Route cơ bản
const promotionRoutes = require('./routes/promotionRoutes');
const orderRoutes = require('./routes/orderRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');

// Middleware
app.use(cors());
app.use(express.json()); // Để server hiểu được req.body dưới dạng JSON
app.use(express.urlencoded({ extended: true }));

// Sử dụng Route
app.use('/api/v1/promotions', promotionRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/invoices', invoiceRoutes);

// Test server đang chạy
app.get('/', (req, res) => {
  res.send('Restaurant Management System API is running...');
});

// Middleware xử lý lỗi 404 (Không tìm thấy route)
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Endpoint không tồn tại' });
});

// Bắt đầu server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
