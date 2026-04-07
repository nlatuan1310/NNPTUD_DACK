const prisma = require('../config/db');

// @desc    Tính toán Bill nháp & Tạo Invoice (UNPAID)
// @route   POST /api/v1/invoices/checkout
const checkout = async (req, res) => {
    try {
        const { orderId, promotionCode, paymentMethod } = req.body;

        if (!orderId || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Thiếu orderId hoặc paymentMethod' });
        }

        // Lấy thông tin order
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order không tồn tại' });
        }

        if (order.status === 'PAID' || order.status === 'CANCELLED') {
            return res.status(400).json({ success: false, message: 'Đơn hàng này đã đóng, không thể checkout lại' });
        }

        // Kiểm tra xem hoá đơn đã được tạo trước đó chưa
        let existingInvoice = await prisma.invoice.findUnique({
            where: { orderId: orderId }
        });

        if (existingInvoice && existingInvoice.paymentStatus === 'PAID') {
            return res.status(400).json({ success: false, message: 'Hoá đơn này đã được thanh toán rồi' });
        }

        let discountPercentage = 0;
        let validPromotionId = null;

        // Nếu khách cung cấp Promotion Code
        if (promotionCode) {
            const promo = await prisma.promotion.findUnique({ where: { code: promotionCode } });
            
            if (promo && promo.isActive) {
                const currentDate = new Date();
                if (currentDate >= promo.startDate && currentDate <= promo.endDate) {
                    discountPercentage = promo.discountPercentage;
                    validPromotionId = promo.id;
                }
            }
            
            if (discountPercentage === 0) {
                return res.status(400).json({ success: false, message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn' });
            }
        }

        // Tính Final Amount
        const finalAmount = order.totalAmount - (order.totalAmount * (discountPercentage / 100));

        let invoiceResult;

        // Hoặc update invoice hiện có, hoặc tạo mới nếu chưa tồn tại
        if (existingInvoice) {
            invoiceResult = await prisma.invoice.update({
                where: { id: existingInvoice.id },
                data: {
                    finalAmount,
                    paymentMethod,
                    promotionId: validPromotionId
                }
            });
        } else {
            invoiceResult = await prisma.invoice.create({
                data: {
                    orderId,
                    finalAmount,
                    paymentMethod,
                    paymentStatus: 'UNPAID',
                    promotionId: validPromotionId
                }
            });
        }

        res.status(200).json({ success: true, data: invoiceResult });
    } catch (error) {
        console.error('Lỗi khi checkout:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi checkout hoá đơn' });
    }
};

// @desc    Xác nhận thanh toán hoàn tất (PAID)
// @route   PUT /api/v1/invoices/:id/pay
const confirmPayment = async (req, res) => {
    try {
        const { id } = req.params;

        // Lấy thông tin Invoice
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { order: true }
        });

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hoá đơn' });
        }

        if (invoice.paymentStatus === 'PAID') {
            return res.status(400).json({ success: false, message: 'Hoá đơn đã được thanh toán trước đó' });
        }

        // Thực hiện Transaction cập nhật toàn bộ hệ thống
        const [updatedInvoice] = await prisma.$transaction([
            // 1. Cập nhật trạng thái hoá đơn
            prisma.invoice.update({
                where: { id },
                data: { paymentStatus: 'PAID' }
            }),
            // 2. Cập nhật Order thành PAID
            prisma.order.update({
                where: { id: invoice.orderId },
                data: { status: 'PAID' }
            }),
            // 3. Đưa Bàn về AVAILABLE nếu Order này khớp với Bàn
            prisma.table.update({
                where: { id: invoice.order.tableId },
                data: { status: 'AVAILABLE' }
            })
        ]);

        res.status(200).json({ success: true, data: updatedInvoice });
    } catch (error) {
        console.error('Lỗi khi xác nhận thanh toán:', error);
        res.status(500).json({ success: false, message: 'Lỗi server xác nhận hoàn tiền' });
    }
};

// @desc    Xoá Hoá đơn (Chặn nếu Invoice đã thanh toán)
// @route   DELETE /api/v1/invoices/:id
const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id }
        });

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hoá đơn để xoá' });
        }

        // Logic bảo vệ dữ liệu cực kỳ quan trọng:
        if (invoice.paymentStatus === 'PAID') {
            return res.status(403).json({ 
                success: false, 
                message: 'Giao dịch đã tất toán, không thể xóa bỏ để đảm bảo tính an toàn dữ liệu' 
            });
        }

        // Xoá hoá đơn an toàn
        await prisma.invoice.delete({
            where: { id }
        });

        res.status(200).json({ success: true, message: 'Đã huỷ bỏ Hoá đơn chưa thanh toán thành công' });
    } catch (error) {
        console.error('Lỗi xoá hoá đơn:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xoá hoá đơn' });
    }
};

// @desc    Hoàn tiền Hóa đơn (Chuyển Invoice sang REFUNDED, Order sang CANCELLED)
// @route   PUT /api/v1/invoices/:id/refund
const refundInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { order: true }
        });

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hoá đơn để hoàn tiền' });
        }

        if (invoice.paymentStatus !== 'PAID') {
            return res.status(400).json({ 
                success: false, 
                message: 'Chỉ có thể hoàn tiền cho những Hoá đơn Đã thanh toán (PAID).' 
            });
        }

        // Thực hiện Transaction hoàn tiền
        const [refundedInvoice] = await prisma.$transaction([
            // 1. Cập nhật hoá đơn thành REFUNDED
            prisma.invoice.update({
                where: { id },
                data: { paymentStatus: 'REFUNDED' }
            }),
            // 2. Hủy Order liên kết để gạch doanh thu
            prisma.order.update({
                where: { id: invoice.orderId },
                data: { status: 'CANCELLED' }
            })
        ]);

        res.status(200).json({ success: true, message: 'Đã hoàn tiền Hóa đơn thành công.', data: refundedInvoice });
    } catch (error) {
        console.error('Lỗi hoàn tiền hoá đơn:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi hoàn tiền hoá đơn' });
    }
};

// @desc    Lấy danh sách tất cả hóa đơn
// @route   GET /api/v1/invoices
const getAllInvoices = async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                order: {
                    include: {
                        table: true,
                        staff: { select: { name: true } }
                    }
                },
                promotion: true
            }
        });

        res.status(200).json({ success: true, count: invoices.length, data: invoices });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách hoá đơn:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách hoá đơn' });
    }
};

module.exports = {
    checkout,
    confirmPayment,
    deleteInvoice,
    refundInvoice,
    getAllInvoices
};
