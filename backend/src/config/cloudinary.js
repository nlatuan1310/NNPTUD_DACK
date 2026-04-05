const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Khởi tạo tự động từ biến môi trường CLOUDINARY_URL trong .env
// Nếu cấu hình theo chuẩn CLOUDINARY_URL="cloudinary://key:secret@cloud_name" 
// thì package tự động nhận dạng mà không cần gọi lệnh cloudinary.config()

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'nnptud_dack', // Tên thư mục nơi chứa file trên Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // Chỉ cho phép hình ảnh
    },
});

module.exports = {
    cloudinary,
    storage
};
