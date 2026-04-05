const jwt = require('jsonwebtoken');


const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực. Vui lòng đăng nhập.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Gắn thông tin user đã giải mã vào request
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ.',
    });
  }
};

/**
 * Middleware kiểm tra phân quyền theo Role.
 * @param  {...string} allowedRoles - Danh sách role được phép (VD: 'MANAGER', 'STAFF')
 * Sử dụng: checkRole('MANAGER', 'STAFF')
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực người dùng.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền truy cập. Yêu cầu role: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = { verifyToken, checkRole };
