const prisma = require('../config/db');

// Lấy toàn bộ danh sách món ăn kèm với danh mục
const getAllFoods = async (req, res) => {
  try {
    const foods = await prisma.food.findMany({
      include: { category: true }
    });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy dữ liệu món ăn', error: error.message });
  }
};

// Lấy thông tin một món ăn chi tiết
const getFoodById = async (req, res) => {
  const { id } = req.params;
  try {
    const food = await prisma.food.findUnique({
      where: { id },
      include: { category: true }
    });
    if (!food) return res.status(404).json({ message: 'Không tìm thấy món ăn' });
    res.json(food);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tìm món ăn', error: error.message });
  }
};

// Thêm món ăn mới (nhận raw JSON, imageUrl là URL từ endpoint /api/v1/upload)
const createFood = async (req, res) => {
  const { name, description, price, imageUrl, categoryId } = req.body;

  // Validation các trường bắt buộc
  if (!name) return res.status(400).json({ message: 'Tên món ăn là bắt buộc' });
  if (price === undefined || price === null || price === '')
    return res.status(400).json({ message: 'Giá món ăn là bắt buộc' });
  if (!categoryId) return res.status(400).json({ message: 'Danh mục món ăn (categoryId) là bắt buộc' });
  if (isNaN(parseFloat(price)) || parseFloat(price) < 0)
    return res.status(400).json({ message: 'Giá món ăn phải là số hợp lệ và không âm' });

  try {
    const newFood = await prisma.food.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl: imageUrl || null,
        categoryId
      },
      include: { category: true }
    });
    res.status(201).json(newFood);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi tạo món ăn', error: error.message });
  }
};

// Cập nhật món ăn (nhận raw JSON)
const updateFood = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, imageUrl, categoryId, status } = req.body;

  try {
    const updatedFood = await prisma.food.update({
      where: { id },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        imageUrl,
        categoryId,
        status: status !== undefined ? status : undefined
      }
    });
    res.json(updatedFood);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi cập nhật món ăn', error: error.message });
  }
};

// Xóa món ăn
const deleteFood = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.food.delete({ where: { id } });
    res.json({ message: 'Đã xóa món ăn thành công' });
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi xóa món ăn', error: error.message });
  }
};

module.exports = {
  getAllFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood
};
