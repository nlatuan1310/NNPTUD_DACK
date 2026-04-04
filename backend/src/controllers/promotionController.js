const prisma = require('../config/db');

// @desc    Lấy danh sách khuyến mãi
// @route   GET /api/v1/promotions
const getPromotions = async (req, res) => {
    try {
        const { isActive } = req.query;
        let queryOptions = {};

        if (isActive !== undefined) {
            queryOptions.where = { isActive: isActive === 'true' };
        }

        const promotions = await prisma.promotion.findMany(queryOptions);
        res.status(200).json({ success: true, count: promotions.length, data: promotions });
    } catch (error) {
        console.error('Lỗi khi get promotions:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy khuyến mãi' });
    }
};

// @desc    Tạo khuyến mãi mới
// @route   POST /api/v1/promotions
const createPromotion = async (req, res) => {
    try {
        const { code, discountPercentage, startDate, endDate, isActive } = req.body;

        if (!code || discountPercentage === undefined || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin (code, discountPercentage, startDate, endDate)' });
        }

        // Check xem code đã tồn tại chưa
        const existingPromo = await prisma.promotion.findUnique({
            where: { code }
        });

        if (existingPromo) {
            return res.status(400).json({ success: false, message: 'Mã khuyến mãi đã tồn tại' });
        }

        const newPromotion = await prisma.promotion.create({
            data: {
                code,
                discountPercentage,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive: isActive !== undefined ? isActive : true
            }
        });

        res.status(201).json({ success: true, data: newPromotion });
    } catch (error) {
        console.error('Lỗi khi code promotion:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo khuyến mãi' });
    }
};

// @desc    Kiểm tra / Xác thực mã khuyến mãi
// @route   GET /api/v1/promotions/:code/validate
const validatePromotion = async (req, res) => {
    try {
        const { code } = req.params;

        const promotion = await prisma.promotion.findUnique({
            where: { code }
        });

        if (!promotion) {
            return res.status(404).json({ success: false, message: 'Mã khuyến mãi không tồn tại' });
        }

        if (!promotion.isActive) {
            return res.status(400).json({ success: false, message: 'Mã khuyến mãi đã ngừng hoạt động' });
        }

        const currentDate = new Date();
        if (currentDate < promotion.startDate || currentDate > promotion.endDate) {
            return res.status(400).json({ success: false, message: 'Mã khuyến mãi không trong thời gian có hiệu lực' });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Mã hợp lệ',
            data: {
                discountPercentage: promotion.discountPercentage
            }
        });
    } catch (error) {
        console.error('Lỗi khi validate promotion:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xác thực khuyến mãi' });
    }
};

// @desc    Cập nhật khuyến mãi (phần trăm, active...)
// @route   PUT /api/v1/promotions/:id
const updatePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, discountPercentage, startDate, endDate, isActive } = req.body;

        const promotionExists = await prisma.promotion.findUnique({
            where: { id }
        });

        if (!promotionExists) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
        }

        const updatedPromotion = await prisma.promotion.update({
            where: { id },
            data: {
                code: code || promotionExists.code,
                discountPercentage: discountPercentage !== undefined ? discountPercentage : promotionExists.discountPercentage,
                startDate: startDate ? new Date(startDate) : promotionExists.startDate,
                endDate: endDate ? new Date(endDate) : promotionExists.endDate,
                isActive: isActive !== undefined ? isActive : promotionExists.isActive
            }
        });

        res.status(200).json({ success: true, data: updatedPromotion });
    } catch (error) {
        console.error('Lỗi khi cập nhật promotion:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật khuyến mãi' });
    }
};

module.exports = {
    getPromotions,
    createPromotion,
    validatePromotion,
    updatePromotion
};
