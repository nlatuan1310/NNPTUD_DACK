const path = require('path');
// Luôn lấy file .env ở thư mục gốc của backend (đi lên 2 cấp từ src/config)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');

if (!process.env.DATABASE_URL) {
  console.error('[DATABASE_ERROR] Biến DATABASE_URL chưa được thiết lập trong file .env!');
}

const prisma = new PrismaClient();

module.exports = prisma;
