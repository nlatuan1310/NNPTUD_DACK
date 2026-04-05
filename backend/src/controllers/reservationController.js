const prisma = require('../config/db');
const bcrypt = require('bcryptjs');



const RESERVATION_DURATION_HOURS = 2; // Mỗi lượt đặt bàn giữ chỗ 2 tiếng


const checkTimeConflict = async (tableId, newStart, excludeId = null) => {
  const newEnd = new Date(newStart.getTime() + RESERVATION_DURATION_HOURS * 60 * 60 * 1000);

  const whereCondition = {
    tableId,
    status: { in: ['PENDING', 'CONFIRMED'] },

    reservationTime: {
      lt: newEnd, // existing_start < new_end
    },
  };

  if (excludeId) {
    whereCondition.id = { not: excludeId };
  }

  const earliestConflictStart = new Date(
    newStart.getTime() - RESERVATION_DURATION_HOURS * 60 * 60 * 1000
  );
  whereCondition.reservationTime = {
    ...whereCondition.reservationTime,
    gt: earliestConflictStart, // existing_start > (new_start - duration)
  };

  const conflict = await prisma.reservation.findFirst({
    where: whereCondition,
    include: {
      table: { select: { tableNumber: true } },
    },
  });

  return conflict;
};


const createReservation = async (req, res, next) => {
  try {
    const { tableId, reservationTime, guestCount, customerName, customerPhone } = req.body || {};

    if (!tableId || !reservationTime || !guestCount || !customerName || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: tableId, reservationTime, guestCount, customerName, customerPhone.',
      });
    }

    // Kiểm tra bàn tồn tại
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bàn.',
      });
    }

    // Kiểm tra sức chứa bàn
    if (parseInt(guestCount) > table.capacity) {
      return res.status(400).json({
        success: false,
        message: `Bàn số ${table.tableNumber} chỉ chứa tối đa ${table.capacity} khách, nhưng bạn đặt cho ${guestCount} khách.`,
      });
    }

    // Kiểm tra thời gian đặt bàn phải ở tương lai
    const requestedTime = new Date(reservationTime);
    if (requestedTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian đặt bàn phải ở tương lai.',
      });
    }

    // ========== KIỂM TRA XUNG ĐỘT KHUNG GIỜ ==========
    const conflict = await checkTimeConflict(tableId, requestedTime);
    if (conflict) {
      const conflictEnd = new Date(
        conflict.reservationTime.getTime() + RESERVATION_DURATION_HOURS * 60 * 60 * 1000
      );
      return res.status(400).json({
        success: false,
        message: `Bàn số ${table.tableNumber} đã được đặt trong khung giờ ${conflict.reservationTime.toLocaleString('vi-VN')} – ${conflictEnd.toLocaleString('vi-VN')}. Vui lòng chọn bàn khác hoặc khung giờ khác.`,
      });
    }

    // Tạo reservation
    const reservation = await prisma.reservation.create({
      data: {
        customerName,
        customerPhone,
        tableId,
        reservationTime: requestedTime,
        guestCount: parseInt(guestCount),
      },
      include: {
        table: { select: { tableNumber: true, floor: true, capacity: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Đặt bàn thành công! Vui lòng chờ nhà hàng xác nhận.',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};


const getAllReservations = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const where = {};

    if (status) where.status = status;

    // Lọc theo ngày cụ thể
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.reservationTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        table: { select: { tableNumber: true, floor: true, capacity: true } },
      },
      orderBy: { reservationTime: 'asc' },
    });

    return res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
};




const updateReservationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Các trạng thái được phép: ${validStatuses.join(', ')}`,
      });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt chỗ.',
      });
    }

    // Kiểm tra logic chuyển trạng thái hợp lệ
    const currentStatus = reservation.status;
    const allowedTransitions = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['CANCELLED'],
      CANCELLED: [], // Không thể chuyển từ CANCELLED
    };

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển trạng thái từ "${currentStatus}" sang "${status}".`,
      });
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        table: { select: { tableNumber: true, floor: true } },
      },
    });

    // ========== TỰ ĐỘNG ĐỒNG BỘ TRẠNG THÁI BÀN ==========
    if (status === 'CONFIRMED') {
      // Duyệt đặt bàn -> Bàn chuyển sang RESERVED
      await prisma.table.update({
        where: { id: reservation.tableId },
        data: { status: 'RESERVED' },
      });
    } else if (status === 'CANCELLED' && currentStatus === 'CONFIRMED') {
      // Hủy đơn đã duyệt -> Kiểm tra nếu bàn đang RESERVED thì nhả về AVAILABLE
      const table = await prisma.table.findUnique({ where: { id: reservation.tableId } });
      if (table && table.status === 'RESERVED') {
        await prisma.table.update({
          where: { id: reservation.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái đặt bàn thành "${status}".`,
      data: updatedReservation,
    });
  } catch (error) {
    next(error);
  }
};


const updateReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tableId, reservationTime, guestCount } = req.body || {};

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { table: true },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt chỗ.',
      });
    }

    // Chuẩn bị dữ liệu cập nhật
    const updateData = {};
    const finalTableId = tableId || reservation.tableId;
    const finalTime = reservationTime ? new Date(reservationTime) : reservation.reservationTime;
    const finalGuestCount = guestCount ? parseInt(guestCount) : reservation.guestCount;

    // Nếu thay đổi bàn, kiểm tra bàn tồn tại
    if (tableId && tableId !== reservation.tableId) {
      const table = await prisma.table.findUnique({ where: { id: tableId } });
      if (!table) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bàn.',
        });
      }
      // Kiểm tra sức chứa
      if (finalGuestCount > table.capacity) {
        return res.status(400).json({
          success: false,
          message: `Bàn số ${table.tableNumber} chỉ chứa tối đa ${table.capacity} khách.`,
        });
      }
      updateData.tableId = tableId;
    }

    // Nếu thay đổi thời gian, kiểm tra phải ở tương lai
    if (reservationTime) {
      if (finalTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian đặt bàn phải ở tương lai.',
        });
      }
      updateData.reservationTime = finalTime;
    }

    if (guestCount) {
      // Kiểm tra sức chứa bàn hiện tại
      const currentTable = tableId
        ? await prisma.table.findUnique({ where: { id: tableId } })
        : reservation.table;
      if (finalGuestCount > currentTable.capacity) {
        return res.status(400).json({
          success: false,
          message: `Bàn chỉ chứa tối đa ${currentTable.capacity} khách.`,
        });
      }
      updateData.guestCount = finalGuestCount;
    }

    // Kiểm tra xung đột thời gian nếu đổi bàn hoặc đổi giờ
    if (tableId || reservationTime) {
      const conflict = await checkTimeConflict(finalTableId, finalTime, id);
      if (conflict) {
        const conflictEnd = new Date(
          conflict.reservationTime.getTime() + RESERVATION_DURATION_HOURS * 60 * 60 * 1000
        );
        return res.status(400).json({
          success: false,
          message: `Bàn đã được đặt trong khung giờ ${conflict.reservationTime.toLocaleString('vi-VN')} – ${conflictEnd.toLocaleString('vi-VN')}. Vui lòng chọn khung giờ khác.`,
        });
      }
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        table: { select: { tableNumber: true, floor: true, capacity: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật đặt bàn thành công.',
      data: updatedReservation,
    });
  } catch (error) {
    next(error);
  }
};


const deleteReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { table: { select: { tableNumber: true } } },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đặt chỗ.',
      });
    }

    await prisma.reservation.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: `Đã xóa đặt bàn #${reservation.table.tableNumber}.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReservation,
  getAllReservations,
  updateReservationStatus,
  updateReservation,
  deleteReservation,
};
