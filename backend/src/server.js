const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware cơ bản
app.use(cors()); // Cho phép Frontend gọi API
app.use(express.json()); // Đọc dữ liệu JSON từ body request

// Serve thư mục uploads để truy cập ảnh qua URL
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Import Routes
const categoryRoutes = require('./routes/categoryRoutes');
const foodRoutes = require('./routes/foodRoutes');
const ingredientRoutes = require('./routes/ingredientRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Gắn các tuyến đường API
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/foods', foodRoutes);
app.use('/api/v1/ingredients', ingredientRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Route kiểm tra server
app.get('/', (req, res) => {
  res.send('Restaurant Management API is running...');
});

// Route kiểm tra ENV
app.get('/api/v1/test-env', (req, res) => {
  res.json({
    hasUrl: !!process.env.DATABASE_URL,
    urlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) : null
  });
});

// Khởi tạo server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
