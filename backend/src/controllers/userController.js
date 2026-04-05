const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * POST /api/v1/users
 * Tạo người dùng mới (Nhân sự hoặc Khách hàng) bởi MANAGER.
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body || {};

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: name, email, password, role.',
      });
    }

    const validRoles = ['STAFF', 'MANAGER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Quyền hạn không hợp lệ. Vui lòng chọn: ${validRoles.join(', ')}`,
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email này đã tồn tại trong hệ thống.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công.',
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users
 * Lấy danh sách người dùng.
 * - MANAGER: Xem toàn bộ nhân sự.
 * - STAFF: Chỉ được xem thông tin danh sách nhân sự (nếu có quyền).
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query; // Tùy chọn lọc của người dùng nếu họ gửi lên
    let whereCondition = {};

    if (req.user.role === 'STAFF') {
      whereCondition.role = 'STAFF'; // Staff chỉ thấy nội bộ staff với nhau nếu có quyền
    } else if (req.user.role === 'MANAGER') {
      if (role) {
        whereCondition.role = role;
      } else {
        whereCondition.role = { in: ['STAFF', 'MANAGER'] };
      }
    }

    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
      orderBy: { role: 'asc' },
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/users/:id
 * Cập nhật thông tin người dùng (Chỉ MANAGER).
 * Cho phép Update thông tin của Staff/Customer.
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, role } = req.body || {};

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
      });
    }

    // Nếu đổi role sang thứ không hợp lệ
    const validRoles = ['STAFF', 'MANAGER'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Quyền hạn không hợp lệ. Vui lòng chọn: ${validRoles.join(', ')}`,
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone; // Cho phép reset phone về null
    if (role) updateData.role = role;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin người dùng thành công.',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/users/:id
 * Xóa người dùng (Chỉ MANAGER).
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
      });
    }

    // Tùy theo business logic: không nên xóa bản thân mình
    if (existingUser.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự xóa tài khoản của chính mình.',
      });
    }

    // Thực hiện xóa user
    await prisma.user.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: `Đã xóa người dùng mang tên ${existingUser.name}.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createUser, getAllUsers, updateUser, deleteUser };
