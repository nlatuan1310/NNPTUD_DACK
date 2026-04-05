const prisma = require('../config/db');

/**
 * POST /api/v1/tables
 * Tạo bàn mới (Chỉ MANAGER).
 * Body: { tableNumber, floor, capacity }
 */
const createTable = async (req, res, next) => {
  try {
    const { tableNumber, floor, capacity } = req.body || {};

    if (tableNumber == null || floor == null || capacity == null) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: tableNumber, floor, capacity.',
      });
    }

    // Kiểm tra số bàn đã tồn tại
    const existing = await prisma.table.findUnique({
      where: { tableNumber: parseInt(tableNumber) },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Bàn số ${tableNumber} đã tồn tại.`,
      });
    }

    const newTable = await prisma.table.create({
      data: {
        tableNumber: parseInt(tableNumber),
        floor: parseInt(floor),
        capacity: parseInt(capacity),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo bàn thành công.',
      data: newTable,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tables
 * Lấy danh sách tất cả bàn. Hỗ trợ lọc theo floor và status.
 * Query params: ?floor=1&status=AVAILABLE
 */
const getAllTables = async (req, res, next) => {
  try {
    const { floor, status } = req.query;
    const where = {};

    if (floor) where.floor = parseInt(floor);
    if (status) where.status = status;

    const tables = await prisma.table.findMany({
      where,
      orderBy: [{ floor: 'asc' }, { tableNumber: 'asc' }],
    });

    return res.status(200).json({
      success: true,
      count: tables.length,
      data: tables,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/tables/:id
 * Cập nhật thông tin bàn hoặc trạng thái (MANAGER, STAFF).
 * Body: { tableNumber?, floor?, capacity?, status? }
 */
const updateTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tableNumber, floor, capacity, status } = req.body || {};

    // Kiểm tra bàn tồn tại
    const existingTable = await prisma.table.findUnique({ where: { id } });
    if (!existingTable) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bàn.',
      });
    }

    const updateData = {};
    if (tableNumber != null) updateData.tableNumber = parseInt(tableNumber);
    if (floor != null) updateData.floor = parseInt(floor);
    if (capacity != null) updateData.capacity = parseInt(capacity);
    if (status) updateData.status = status;

    const updatedTable = await prisma.table.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật bàn thành công.',
      data: updatedTable,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/tables/:id
 * Xóa bàn (Chỉ MANAGER).
 */
const deleteTable = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingTable = await prisma.table.findUnique({ where: { id } });
    if (!existingTable) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bàn.',
      });
    }

    // Kiểm tra xem bàn có đang có reservation PENDING/CONFIRMED không
    const activeReservations = await prisma.reservation.findFirst({
      where: {
        tableId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (activeReservations) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa bàn đang có đặt chỗ chưa hoàn thành.',
      });
    }

    await prisma.table.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: `Đã xóa bàn số ${existingTable.tableNumber}.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTable, getAllTables, updateTable, deleteTable };
