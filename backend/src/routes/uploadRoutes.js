const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');

// POST /api/v1/upload — Upload 1 ảnh, trả về URL
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Vui lòng chọn file ảnh' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const fullUrl = `${req.protocol}://${req.get('host')}${imageUrl}`;

  res.status(201).json({
    message: 'Upload ảnh thành công',
    imageUrl: fullUrl
  });
});

module.exports = router;
