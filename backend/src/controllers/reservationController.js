const prisma = require('../config/db');

// ============================================================
// NGHIỆP VỤ NHÀ HÀNG - Quy tắc đặt bàn:
// - Khách chọn ngày giờ đến (reservationTime) và số khách (guestCount).
// - Hệ thống kiểm tra bàn đó có đang bị giữ chỗ trong khung giờ đó không.
// - Một lượt đặt bàn (reservation) chiếm giữ bàn trong khoảng thời gian
//   RESERVATION_DURATION_HOURS (mặc định 2 tiếng) kể từ reservationTime.
// - Nếu thời gian đặt mới chồng lấn với bất kỳ reservation nào đang
//   PENDING hoặc CONFIRMED trên cùng bàn đó → từ chối.
// ============================================================

const RESERVATION_DURATION_HOURS = 2; // Mỗi lượt đặt bàn giữ chỗ 2 tiếng


const checkTimeConflict = async (tableId, newStart, excludeId = null) => {
  const newEnd = new Date(newStart.getTime() + RESERVATION_DURATION_HOURS * 60 * 60 * 1000);

  // Tìm tất cả reservation đang active (PENDING hoặc CONFIRMED)
  // trên cùng bàn, mà khoảng thời gian bị chồng lấn
  const whereCondition = {
    tableId,
    status: { in: ['PENDING', 'CONFIRMED'] },
    // Hai khoảng [A_start, A_end) và [B_start, B_end) giao nhau khi:
    // A_start < B_end AND A_end > B_start
    reservationTime: {
      lt: newEnd, // existing_start < new_end
    },
  };

  if (excludeId) {
    whereCondition.id = { not: excludeId };
  }

  // Chúng ta cần kiểm tra thêm: existing_end > new_start
  // existing_end = existing_start + DURATION
  // → existing_start > new_start - DURATION
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

/**
 * POST /api/v1/reservations
 * Tạo đặt bàn mới. Khách hoặc Nhân viên đặt hộ.
 * Body: { tableId, reservationTime, guestCount }
 */
const createReservation = async (req, res, next) => {
  try {
    const { tableId, reservationTime, guestCount } = req.body || {};

    if (!tableId || !reservationTime || !guestCount) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: tableId, reservationTime, guestCount.',
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
        userId: req.user.id,
        tableId,
        reservationTime: requestedTime,
        guestCount: parseInt(guestCount),
      },
      include: {
        table: { select: { tableNumber: true, floor: true, capacity: true } },
        user: { select: { name: true, email: true, phone: true } },
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

/**
 * GET /api/v1/reservations
 * Lấy toàn bộ danh sách đặt bàn (MANAGER, STAFF).
 * Query params: ?status=PENDING&date=2026-04-05
 */
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
        user: { select: { id: true, name: true, email: true, phone: true } },
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

/**
 * GET /api/v1/reservations/my
 * Lấy lịch sử đặt bàn của khách hàng đang đăng nhập (CUSTOMER).
 */
const getMyReservations = async (req, res, next) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { userId: req.user.id },
      include: {
        table: { select: { tableNumber: true, floor: true, capacity: true } },
      },
      orderBy: { reservationTime: 'desc' },
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

/**
 * PUT /api/v1/reservations/:id/status
 * Cập nhật trạng thái đặt bàn (MANAGER, STAFF).
 * Body: { status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' }
 *
 * Nghiệp vụ nhà hàng:
 * - PENDING → CONFIRMED: Nhà hàng xác nhận đơn đặt.
 * - PENDING/CONFIRMED → CANCELLED: Hủy đặt bàn.
 * - CONFIRMED → COMPLETED: Khách đã đến và hoàn tất phiên ăn.
 */
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
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái đặt bàn thành "${status}".`,
      data: updatedReservation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReservation,
  getAllReservations,
  getMyReservations,
  updateReservationStatus,
};
