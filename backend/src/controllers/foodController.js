const prisma = require('../config/db');

// =============================================
// @desc    Lấy danh sách tất cả món ăn
// @route   GET /api/v1/foods
// @access  Public
// =============================================
const getFoods = async (req, res) => {
    try {
        const foods = await prisma.food.findMany({
            include: {
                category: {
                    select: {
                        name: true // Kèm theo tên danh mục để FE tiện hiển thị
                    }
                }
            },
            orderBy: {
                name: 'asc' // Sắp xếp theo tên A-Z
            }
        });

        res.status(200).json({
            success: true,
            count: foods.length,
            data: foods
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách món ăn:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách món ăn'
        });
    }
};

// =============================================
// @desc    Lấy chi tiết một món ăn theo ID
// @route   GET /api/v1/foods/:id
// @access  Public
// =============================================
const getFoodById = async (req, res) => {
    try {
        const { id } = req.params;

        const food = await prisma.food.findUnique({
            where: { id },
             include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn với ID này'
            });
        }

        res.status(200).json({
            success: true,
            data: food
        });
    } catch (error) {
        console.error('Lỗi khi lấy món ăn theo ID:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin món ăn'
        });
    }
};

// =============================================
// @desc    Thêm món ăn mới
// @route   POST /api/v1/foods
// @access  Manager
// =============================================
const createFood = async (req, res) => {
    try {
        const { name, description, price, imageUrl, categoryId, status } = req.body;

        // Kiểm tra các trường bắt buộc
        if (!name || name.trim() === '' || price === undefined || !categoryId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ tên món, giá tiền và ID danh mục'
            });
        }

        // Kiểm tra giá tiền hợp lệ
        if (Number(price) < 0) {
             return res.status(400).json({
                success: false,
                message: 'Giá tiền không được nhỏ hơn 0'
            });
        }

        // Kiểm tra categoryId có thật sự tồn tại trong DB không
        const existingCategory = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        if (!existingCategory) {
             return res.status(400).json({
                success: false,
                message: 'Danh mục (categoryId) cung cấp không tồn tại'
            });
        }

        // Tạo món ăn
        const newFood = await prisma.food.create({
            data: {
                name: name.trim(),
                description: description ? description.trim() : null,
                price: parseFloat(price),
                imageUrl: imageUrl || null,
                categoryId: categoryId,
                status: status !== undefined ? status : true // Mặc định là true nếu không gửi
            }
        });

        res.status(201).json({
            success: true,
            message: 'Tạo món ăn thành công',
            data: newFood
        });
    } catch (error) {
        console.error('Lỗi khi tạo món ăn:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo món ăn'
        });
    }
};

// =============================================
// @desc    Cập nhật thông tin món ăn
// @route   PUT /api/v1/foods/:id
// @access  Manager
// =============================================
const updateFood = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, imageUrl, categoryId, status } = req.body;

        // Kiểm tra món ăn có tồn tại không trước khi sửa
        const existingFood = await prisma.food.findUnique({
            where: { id }
        });

        if (!existingFood) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn với ID này'
            });
        }

        // Nếu có sửa giá tiền, kiểm tra không được tính giá âm
        if (price !== undefined && Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Giá tiền không được nhỏ hơn 0'
            });
        }

        // Nếu đổi danh mục, kiểm tra danh mục mới có tồn tại không
        if (categoryId && categoryId !== existingFood.categoryId) {
             const existingCategory = await prisma.category.findUnique({
                where: { id: categoryId }
            });

            if (!existingCategory) {
                 return res.status(400).json({
                    success: false,
                    message: 'Danh mục mới (categoryId) không tồn tại'
                });
            }
        }

        // Cập nhật món ăn
        const updatedFood = await prisma.food.update({
            where: { id },
            data: {
                name: name ? name.trim() : existingFood.name,
                description: description !== undefined ? description.trim() : existingFood.description,
                price: price !== undefined ? parseFloat(price) : existingFood.price,
                imageUrl: imageUrl !== undefined ? imageUrl : existingFood.imageUrl,
                categoryId: categoryId || existingFood.categoryId,
                status: status !== undefined ? status : existingFood.status
            }
        });

        res.status(200).json({
            success: true,
            message: 'Cập nhật món ăn thành công',
            data: updatedFood
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật món ăn:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thông tin món ăn'
        });
    }
};

// =============================================
// @desc    Xóa món ăn
// @route   DELETE /api/v1/foods/:id
// @access  Manager
// =============================================
const deleteFood = async (req, res) => {
    try {
        const { id } = req.params;

        // Kiểm tra món ăn tồn tại không
        const existingFood = await prisma.food.findUnique({
            where: { id }
        });

        if (!existingFood) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn để xóa'
            });
        }

        // Kiểm tra món ăn đã có trong hóa đơn/order (OrderItem) chưa
        const orderItemCount = await prisma.orderItem.count({
            where: { foodId: id }
        });

        if (orderItemCount > 0) {
             return res.status(400).json({
                success: false,
                message: 'Không thể xóa món ăn này vì nó đã được đặt trong các hóa đơn. Chỉ nên ẩn món ăn đi (chuyển status thành false).'
            });
        }

        // Tiến hành xóa
        await prisma.food.delete({
            where: { id }
        });

        res.status(200).json({
            success: true,
            message: `Đã xóa món ăn "${existingFood.name}" thành công`
        });
    } catch (error) {
        console.error('Lỗi khi xóa món ăn:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa món ăn'
        });
    }
};

module.exports = {
    getFoods,
    getFoodById,
    createFood,
    updateFood,
    deleteFood
};
