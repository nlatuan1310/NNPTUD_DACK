const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Đăng ký tài khoản mới
const register = async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: 'name, email và password là bắt buộc' });

  try {
    // Kiểm tra email đã tồn tại chưa
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email đã được sử dụng' });

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        // Mặc định CUSTOMER, chỉ cho đặt STAFF/MANAGER nếu cần test
        role: role || 'CUSTOMER'
      }
    });

    res.status(201).json({
      message: 'Đăng ký thành công',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    res.status(400).json({ message: 'Lỗi đăng ký', error: error.message });
  }
};

// Đăng nhập - trả về JWT Token
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'email và password là bắt buộc' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });

    // Tạo JWT Token chứa id, name, email, role
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đăng nhập', error: error.message });
  }
};

module.exports = { register, login };
