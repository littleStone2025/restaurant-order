// 图片上传路由
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { JWT_SECRET } = require('../config');

// 鉴权中间件
function auth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ code: 401, msg: '未登录', data: null });
  try {
    require('jsonwebtoken').verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ code: 401, msg: 'Token 无效', data: null });
  }
}

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;
    cb(null, filename);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('仅支持 JPG、PNG、GIF、WebP 格式图片'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

const router = express.Router();

// 上传单张图片（需登录）
router.post('/image', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, msg: '请选择图片文件', data: null });
  }
  
  // 返回图片URL（相对路径）
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({
    code: 0,
    msg: '上传成功',
    data: {
      url: imageUrl,
      filename: req.file.filename,
      size: req.file.size,
    }
  });
});

// 删除图片（需登录）
router.delete('/image', auth, (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ code: 400, msg: '缺少图片地址', data: null });
  
  // 安全检查：只允许删除 /uploads/ 目录下的文件
  if (!url.startsWith('/uploads/')) {
    return res.status(400).json({ code: 400, msg: '无效的图片地址', data: null });
  }
  
  const filepath = path.join(__dirname, '../public', url);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
  
  res.json({ code: 0, msg: '删除成功', data: null });
});

// 错误处理
router.use((err, req, res, next) => {
  if (err.message.includes('format')) {
    return res.status(400).json({ code: 400, msg: err.message, data: null });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ code: 400, msg: '图片大小不能超过 5MB', data: null });
  }
  next(err);
});

module.exports = router;
