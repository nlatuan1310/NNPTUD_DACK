const jwt = require('jsonwebtoken');

/**
 * Middleware 1: Xác thực JWT Token
 * Kiểm tra Authorization header, giải mã token và gắn thông tin user vào req.user
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Truy cập bị từ chối. Vui lòng đăng nhập.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, email, role }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

/**
 * Middleware 2: Phân quyền theo Role
 * Nhận vào danh sách role được phép, trả về middleware kiểm tra.
 * Ví dụ: authorize('MANAGER') hoặc authorize('STAFF', 'MANAGER')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa xác thực.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Bạn không có quyền thực hiện hành động này. Yêu cầu role: ${allowedRoles.join(' hoặc ')}.`
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
