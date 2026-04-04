const prisma = require('../config/db');

// Lấy toàn bộ nguyên liệu
const getAllIngredients = async (req, res) => {
  try {
    const ingredients = await prisma.ingredient.findMany();
    // Phân tích thêm xem món nào sắp hết hàng
    const dataWithAlert = ingredients.map(item => ({
      ...item,
      lowStock: item.stockQuantity <= item.reorderLevel
    }));
    res.json(dataWithAlert);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy dữ liệu nguyên liệu', error: error.message });
  }
};

// Lấy một nguyên liệu chi tiết
const getIngredientById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await prisma.ingredient.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tìm nguyên liệu', error: error.message });
  }
};

// Tạo nguyên liệu mới
const createIngredient = async (req, res) => {
  const { name, unit, stockQuantity, reorderLevel } = req.body;

  // Validation các trường bắt buộc
  if (!name) return res.status(400).json({ message: 'Tên nguyên liệu là bắt buộc' });
  if (!unit) return res.status(400).json({ message: 'Đơn vị (unit) là bắt buộc' });
  if (stockQuantity === undefined || stockQuantity === null || stockQuantity === '')
    return res.status(400).json({ message: 'Số lượng tồn kho (stockQuantity) là bắt buộc' });
  if (reorderLevel === undefined || reorderLevel === null || reorderLevel === '')
    return res.status(400).json({ message: 'Mức đặt hàng lại (reorderLevel) là bắt buộc' });
  if (isNaN(parseFloat(stockQuantity)) || parseFloat(stockQuantity) < 0)
    return res.status(400).json({ message: 'stockQuantity phải là số không âm' });
  if (isNaN(parseFloat(reorderLevel)) || parseFloat(reorderLevel) < 0)
    return res.status(400).json({ message: 'reorderLevel phải là số không âm' });

  try {
    const newItem = await prisma.ingredient.create({
      data: {
        name,
        unit,
        stockQuantity: parseFloat(stockQuantity),
        reorderLevel: parseFloat(reorderLevel)
      }
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi tạo nguyên liệu', error: error.message });
  }
};

// Cập nhật nguyên liệu
const updateIngredient = async (req, res) => {
  const { id } = req.params;
  const { name, unit, stockQuantity, reorderLevel } = req.body;
  try {
    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        unit,
        stockQuantity: stockQuantity !== undefined ? parseFloat(stockQuantity) : undefined,
        reorderLevel: reorderLevel !== undefined ? parseFloat(reorderLevel) : undefined
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Lỗi cập nhật nguyên liệu', error: error.message });
  }
};

// Xóa nguyên liệu
const deleteIngredient = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.ingredient.delete({ where: { id } });
    res.json({ message: 'Đã xóa nguyên liệu thành công' });
  } catch (error) {
    res.status(400).json({ message: 'Lỗi khi xóa nguyên liệu', error: error.message });
  }
};

module.exports = {
  getAllIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient
};
