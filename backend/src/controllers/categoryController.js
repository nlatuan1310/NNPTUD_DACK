const prisma = require('../config/db');

// =============================================
// @desc    Lấy danh sách tất cả danh mục
// @route   GET /api/v1/categories
// @access  Public
// =============================================
const getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách danh mục:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách danh mục'
        });
    }
};

// =============================================
// @desc    Lấy một danh mục theo ID (kèm danh sách món ăn)
// @route   GET /api/v1/categories/:id
// @access  Public
// =============================================
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                foods: {
                    where: { status: true },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        imageUrl: true,
                        status: true
                    }
                }
            }
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục với ID này'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh mục theo ID:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh mục'
        });
    }
};

// =============================================
// @desc    Tạo danh mục mới
// @route   POST /api/v1/categories
// @access  Manager
// =============================================
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // --- Kiểm tra dữ liệu đầu vào ---
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Tên danh mục (name) là bắt buộc'
            });
        }

        const trimmedName = name.trim();

        // --- Kiểm tra tên trùng lặp ---
        const existingCategory = await prisma.category.findFirst({
            where: { name: trimmedName }
        });

        if (existingCategory) {
            return res.status(409).json({
                success: false,
                message: `Danh mục với tên "${trimmedName}" đã tồn tại`
            });
        }

        // --- Tạo danh mục mới ---
        const newCategory = await prisma.category.create({
            data: {
                name: trimmedName,
                description: description ? description.trim() : null
            }
        });

        res.status(201).json({
            success: true,
            message: 'Tạo danh mục thành công',
            data: newCategory
        });
    } catch (error) {
        console.error('Lỗi khi tạo danh mục:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo danh mục'
        });
    }
};

// =============================================
// @desc    Cập nhật thông tin danh mục
// @route   PUT /api/v1/categories/:id
// @access  Manager
// =============================================
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        // --- Kiểm tra danh mục tồn tại không ---
        const existingCategory = await prisma.category.findUnique({
            where: { id }
        });

        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục với ID này'
            });
        }

        // --- Nếu đổi tên, kiểm tra trùng tên với danh mục khác ---
        if (name && name.trim() !== existingCategory.name) {
            const duplicateName = await prisma.category.findFirst({
                where: {
                    name: name.trim(),
                    NOT: { id }
                }
            });

            if (duplicateName) {
                return res.status(409).json({
                    success: false,
                    message: `Danh mục với tên "${name.trim()}" đã tồn tại`
                });
            }
        }

        // --- Cập nhật danh mục ---
        const updatedCategory = await prisma.category.update({
            where: { id },
            data: {
                name: name ? name.trim() : existingCategory.name,
                description: description !== undefined ? description.trim() : existingCategory.description
            }
        });

        res.status(200).json({
            success: true,
            message: 'Cập nhật danh mục thành công',
            data: updatedCategory
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật danh mục:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật danh mục'
        });
    }
};

// =============================================
// @desc    Xóa danh mục
// @route   DELETE /api/v1/categories/:id
// @access  Manager
// =============================================
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // --- Kiểm tra danh mục tồn tại không ---
        const existingCategory = await prisma.category.findUnique({
            where: { id }
        });

        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục với ID này'
            });
        }

        // --- Kiểm tra nghiệp vụ: đếm số món ăn thuộc danh mục ---
        const foodCount = await prisma.food.count({
            where: { categoryId: id }
        });

        if (foodCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa danh mục "${existingCategory.name}" vì vẫn còn ${foodCount} món ăn thuộc danh mục này. Vui lòng chuyển hoặc xóa các món ăn trước.`
            });
        }

        // --- Tiến hành xóa ---
        await prisma.category.delete({
            where: { id }
        });

        res.status(200).json({
            success: true,
            message: `Đã xóa danh mục "${existingCategory.name}" thành công`
        });
    } catch (error) {
        console.error('Lỗi khi xóa danh mục:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa danh mục'
        });
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
