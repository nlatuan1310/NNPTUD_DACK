const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// Lấy link kết nối từ env (-pooler link)
const connectionString = process.env.DATABASE_URL;

// Dùng 'pg' chuẩn tương thích với PrismaPg thay vì @neondatabase/serverless
// Serverless driver không hỗ trợ "-pooler" URL của môi trường Runtime.
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;