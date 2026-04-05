const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;


// ======================== IMPORT ROUTES ========================

const promotionRoutes = require('./routes/promotionRoutes');
const orderRoutes = require('./routes/orderRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const authRoutes = require('./routes/authRoutes');
const tableRoutes = require('./routes/tableRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const foodRoutes = require('./routes/foodRoutes');
const ingredientRoutes = require('./routes/ingredientRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// ======================== MIDDLEWARE ========================
app.use(cors());
app.use(express.json()); // Để server hiểu được req.body dưới dạng JSON
app.use(express.urlencoded({ extended: true }));


// ======================== API ROUTES ========================
app.use('/api/v1/promotions', promotionRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tables', tableRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/foods', foodRoutes);
app.use('/api/v1/ingredients', ingredientRoutes);
app.use('/api/v1/uploads', uploadRoutes);

// ======================== CATCH ERROR & LISTEN ========================
// Test server đang chạy
app.get('/', (req, res) => {
  res.send('Restaurant Management System API is running...');
});

// Middleware xử lý lỗi 404 (Không tìm thấy route) 
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Endpoint không tồn tại' });
});

// Middleware xử lý lỗi hệ thống 
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Bắt đầu server 
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
