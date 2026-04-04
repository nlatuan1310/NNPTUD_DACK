const prisma = require('../config/db');

// Lấy danh sách tất cả danh mục món ăn
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { foods: true } // Lấy kèm các món ăn thuộc danh mục này
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy dữ liệu danh mục', error: error.message });
  }
};

// Lấy chi tiết một danh mục theo ID
const getCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { foods: true }
    });
    if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tìm danh mục', error: error.message });
  }
};

// Tạo một danh mục mới
const createCategory = async (req, res) => {
  console.log('--- Nhận request tạo Category ---');
  console.log('Body:', req.body);
  
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
  
  try {
    console.log('Đang thử tạo trong Database...');
    const newCategory = await prisma.category.create({
      data: { name, description }
    });
    console.log('Tạo thành công:', newCategory.id);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Lỗi Database:', error.message);
    res.status(400).json({ message: 'Lỗi khi tạo danh mục', error: error.message });
  }
};


// Cập nhật thông tin danh mục
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
  try {
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name, description }
    });
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi cập nhật danh mục', error: error.message });
  }
};

// Xóa một danh mục (chỉ được xóa nếu không còn món ăn nào liên kết)
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    // Kiểm tra trước xem còn món ăn thuộc danh mục này không
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { foods: true } } }
    });
    if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    if (category._count.foods > 0) {
      return res.status(400).json({
        message: `Không thể xóa: Danh mục đang chứa ${category._count.foods} món ăn. Hãy xóa hoặc chuyển món ăn sang danh mục khác trước.`
      });
    }
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Đã xóa danh mục thành công' });
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi xóa danh mục', error: error.message });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
