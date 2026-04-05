const bcrypt = require('bcryptjs');
const prisma = require('../src/config/db');
async function main() {
  console.log('Bắt đầu quy trình Seed dữ liệu...');

  // 1. Clear Data
  await prisma.orderItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.order.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.food.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Đã xóa dữ liệu cũ.');

  // 2. Tao User
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash('123456', salt);
  const manager = await prisma.user.create({
    data: { name: 'Admin Manager', email: 'admin@gmail.com', password: hashPassword, role: 'MANAGER', phone: '0123456789' }
  });
  const staff = await prisma.user.create({
    data: { name: 'Staff Phu Vu', email: 'staff@gmail.com', password: hashPassword, role: 'STAFF', phone: '0123456788' }
  });
  console.log('✅ Đã tạo các role user nội bộ mẫu.');

  // 3. Tao Ban
  for (let i = 1; i <= 6; i++) {
    await prisma.table.create({
      data: { tableNumber: i, floor: 1, capacity: 4, status: 'AVAILABLE' }
    });
  }
  console.log('✅ Đã tạo 6 bàn mẫu.');

  // 4. Tao Category
  const catMain = await prisma.category.create({ data: { name: 'Món Chính', description: 'Cơm, phở, xào...' } });
  const catDrink = await prisma.category.create({ data: { name: 'Đồ Uống', description: 'Nước ép, sinh tố...' } });

  // 5. Tao Food
  await prisma.food.createMany({
    data: [
      { name: 'Cơm Rang Dưa Bò', description: 'Cơm rang ngon tuyệt', price: 55000, categoryId: catMain.id, status: true, imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' },
      { name: 'Phở Bò Tái Nạm', description: 'Phở gia truyền Hà Nội', price: 45000, categoryId: catMain.id, status: true, imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' },
      { name: 'Sinh Tố Bơ', description: 'Bơ loại 1', price: 35000, categoryId: catDrink.id, status: true, imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' }
    ]
  });
  console.log('✅ Đã tạo Category & Món ăn mẫu.');

  console.log('Tất cả xong! Bạn có thể login bằng admin@gmail.com / 123456');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
