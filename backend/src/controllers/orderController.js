const prisma = require('../config/db');

// @desc    Khởi tạo (Mở) một Order mới cho một Bàn
// @route   POST /api/v1/orders
const createOrder = async (req, res) => {
    try {
        const { tableId, staffId } = req.body;

        if (!tableId || !staffId) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tableId và staffId' });
        }

        // Kiểm tra xem bàn có tồn tại không và trạng thái có phải là AVAILABLE hoặc RESERVED
        const table = await prisma.table.findUnique({
            where: { id: tableId }
        });

        if (!table) {
            return res.status(404).json({ success: false, message: 'Bàn không tồn tại' });
        }

        if (table.status === 'OCCUPIED') {
            return res.status(400).json({ success: false, message: 'Bàn này đang có khách (OCCUPIED)' });
        }

        // Tạo Order và cập nhật Table sang OCCUPIED trong 1 Transaction
        const [newOrder, updatedTable] = await prisma.$transaction([
            prisma.order.create({
                data: {
                    tableId,
                    staffId,
                    status: 'PENDING',
                    totalAmount: 0
                }
            }),
            prisma.table.update({
                where: { id: tableId },
                data: { status: 'OCCUPIED' }
            })
        ]);

        res.status(201).json({ success: true, data: newOrder });
    } catch (error) {
        console.error('Lỗi khi tạo Order:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi mở Order' });
    }
};

// @desc    Lấy danh sách các đơn hàng (Orders)
// @route   GET /api/v1/orders
const getOrders = async (req, res) => {
    try {
        const { status, tableId } = req.query;
        let queryOptions = {
            include: {
                table: true,
                staff: {
                    select: { id: true, name: true, role: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        };
        let whereClause = {};

        if (status) whereClause.status = status;
        if (tableId) whereClause.tableId = tableId;

        if (Object.keys(whereClause).length > 0) {
            queryOptions.where = whereClause;
        }

        const orders = await prisma.order.findMany(queryOptions);

        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách Orders:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy Orders' });
    }
};

// @desc    Lấy chi tiết một Order (kèm danh sách món)
// @route   GET /api/v1/orders/:id
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                table: true,
                staff: { select: { id: true, name: true } },
                orderItems: {
                    include: {
                        food: { select: { id: true, name: true, price: true, imageUrl: true } }
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy Order' });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết Order:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết Order' });
    }
};

// @desc    Cập nhật trạng thái đơn (PENDING, PREPARING, SERVED...)
// @route   PUT /api/v1/orders/:id/status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['PENDING', 'PREPARING', 'SERVED', 'CANCELLED', 'PAID'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }

        const existingOrder = await prisma.order.findUnique({ where: { id } });
        if (!existingOrder) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy Order' });
        }

        // Update trạng thái
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status }
        });

        // Nếu Hủy đơn, phải giải phóng bàn (nếu chưa thanh toán)
        // Tuy nhiên logic phức tạp hơn có thể cần thêm Transaction, tạm thiết lập cơ bản:
        if (status === 'CANCELLED') {
            await prisma.table.update({
                where: { id: existingOrder.tableId },
                data: { status: 'AVAILABLE' }
            });
        }

        res.status(200).json({ success: true, data: updatedOrder });
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái Order:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái đơn' });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus
};
