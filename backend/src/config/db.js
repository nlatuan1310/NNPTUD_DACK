require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');

// Gán WebSocket chuẩn để có thể chạy trên môi trường Node.js Serverless
neonConfig.webSocketConstructor = ws;

// Lấy link kết nối Pool từ env
const connectionString = process.env.DATABASE_URL;

// Khởi tạo Pool chuyên biệt 
const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);

// Khởi tạo và báo cho Prisma sử dụng adapter này
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
