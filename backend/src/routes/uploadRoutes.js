const express = require('express');
const router = express.Router();
const multer = require('multer');
const { cloudinary, storage } = require('../config/cloudinary');

// Khởi tạo multer với storage cloudinary
const upload = multer({ storage });

// =============================================
// @desc    Upload 1 hình ảnh lên Cloudinary
// @route   POST /api/v1/uploads
// @access  Manager/Staff
// =============================================

// Middleware `upload.single('image')` sẽ tìm file gửi lên theo key 'image'
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy file tải lên (key bắt buộc là: image)'
            });
        }

        // Trả về cả URL và public_id (Dùng public_id này để xóa sau này)
        res.status(200).json({
            success: true,
            message: 'Tải ảnh thành công',
            imageUrl: req.file.path,
            publicId: req.file.filename // Đây là mã định danh để xóa
        });
    } catch (error) {
        console.error('Lỗi upload image:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi upload hình ảnh'
        });
    }
});

// =============================================
// @desc    Xóa 1 hình ảnh khỏi Cloudinary
// @route   DELETE /api/v1/uploads
// @access  Manager
// =============================================
router.delete('/', async (req, res) => {
    try {
        const { publicId } = req.body;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp publicId của ảnh cần xóa'
            });
        }

        // Mã lệnh xóa trên Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'not found') {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy ảnh với publicId này trên hệ thống'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đã xóa ảnh trên Cloudinary thành công',
            result: result
        });
    } catch (error) {
        console.error('Lỗi xóa ảnh:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa hình ảnh'
        });
    }
});

module.exports = router;
