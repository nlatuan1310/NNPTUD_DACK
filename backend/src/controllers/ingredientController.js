const prisma = require('../config/db');

// =============================================
// @desc    Lấy danh sách tất cả nguyên liệu
// @route   GET /api/v1/ingredients
// @access  Public (hoặc Nhân viên)
// =============================================
const getIngredients = async (req, res) => {
    try {
        const ingredients = await prisma.ingredient.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        res.status(200).json({
            success: true,
            count: ingredients.length,
            data: ingredients
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách nguyên liệu:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách nguyên liệu'
        });
    }
};

// =============================================
// @desc    Xem chi tiết một nguyên liệu
// @route   GET /api/v1/ingredients/:id
// @access  Public/Staff
// =============================================
const getIngredientById = async (req, res) => {
    try {
        const { id } = req.params;

        const ingredient = await prisma.ingredient.findUnique({
            where: { id }
        });

        if (!ingredient) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nguyên liệu với ID này'
            });
        }

        res.status(200).json({
            success: true,
            data: ingredient
        });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết nguyên liệu:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy nguyên liệu'
        });
    }
};

// =============================================
// @desc    Thêm nguyên liệu mới vào kho
// @route   POST /api/v1/ingredients
// @access  Manager
// =============================================
const createIngredient = async (req, res) => {
    try {
        const { name, unit, stockQuantity, reorderLevel } = req.body;

        // Kiểm tra trường bắt buộc
        if (!name || name.trim() === '' || !unit || unit.trim() === '') {
             return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ tên và đơn vị tính (unit) của nguyên liệu'
            });
        }

        const parsedStock = stockQuantity !== undefined ? parseFloat(stockQuantity) : 0;
        const parsedReorder = reorderLevel !== undefined ? parseFloat(reorderLevel) : 0;

        if (parsedStock < 0 || parsedReorder < 0) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng tồn và mức cảnh báo (reorderLevel) không được nhỏ hơn 0'
            });
        }

        const newIngredient = await prisma.ingredient.create({
            data: {
                name: name.trim(),
                unit: unit.trim(),
                stockQuantity: parsedStock,
                reorderLevel: parsedReorder
            }
        });

        res.status(201).json({
            success: true,
            message: 'Đã thêm nguyên liệu mới',
            data: newIngredient
        });
    } catch (error) {
        console.error('Lỗi khi tạo nguyên liệu:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thêm nguyên liệu'
        });
    }
};

// =============================================
// @desc    Cập nhật thông tin nguyên liệu (VD: Nhập xuất kho)
// @route   PUT /api/v1/ingredients/:id
// @access  Staff / Manager
// =============================================
const updateIngredient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, unit, stockQuantity, reorderLevel } = req.body;

        const ingredientExists = await prisma.ingredient.findUnique({
            where: { id }
        });

        if (!ingredientExists) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nguyên liệu cần sửa'
            });
        }

        // Validate tính logic của số lượng
        let parsedStock = ingredientExists.stockQuantity;
        let parsedReorder = ingredientExists.reorderLevel;

        if (stockQuantity !== undefined) {
             parsedStock = parseFloat(stockQuantity);
             if (parsedStock < 0) {
                 return res.status(400).json({ success: false, message: 'Số lượng không được âm' });
             }
        }

        if (reorderLevel !== undefined) {
             parsedReorder = parseFloat(reorderLevel);
             if (parsedReorder < 0) {
                 return res.status(400).json({ success: false, message: 'Mức cảnh báo tồn kho không được âm' });
             }
        }

        const updatedIngredient = await prisma.ingredient.update({
            where: { id },
            data: {
                name: name ? name.trim() : ingredientExists.name,
                unit: unit ? unit.trim() : ingredientExists.unit,
                stockQuantity: parsedStock,
                reorderLevel: parsedReorder
            }
        });

        res.status(200).json({
            success: true,
            message: 'Cập nhật nguyên liệu thành công',
            data: updatedIngredient
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật nguyên liệu:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật nguyên liệu'
        });
    }
};

// =============================================
// @desc    Xóa nguyên liệu khỏi hệ thống
// @route   DELETE /api/v1/ingredients/:id
// @access  Manager
// =============================================
const deleteIngredient = async (req, res) => {
    try {
        const { id } = req.params;

        const ingredientExists = await prisma.ingredient.findUnique({
            where: { id }
        });

        if (!ingredientExists) {
             return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nguyên liệu để xóa'
            });
        }

        await prisma.ingredient.delete({
            where: { id }
        });

        res.status(200).json({
            success: true,
            message: `Đã xóa nguyên liệu "${ingredientExists.name}" thành công`
        });
    } catch (error) {
        console.error('Lỗi khi xóa nguyên liệu:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa nguyên liệu'
        });
    }
};

module.exports = {
    getIngredients,
    getIngredientById,
    createIngredient,
    updateIngredient,
    deleteIngredient
};
