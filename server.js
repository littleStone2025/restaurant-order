// 味道鲜餐厅点单系统 — 主服务入口
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { PORT, NODE_ENV, STATIC_DIR } = require('./config');
const { initSchema, seedData } = require('./db/schema');

// 初始化数据库
initSchema();
seedData();

const app = express();

// ============ 中间件 ============
// helmet 默认 CSP 会阻止内联脚本，改为宽松模式
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false, // 开发环境关闭 CSP
}));
app.use(cors({
  origin: true, // 生产环境应限制为具体域名
  credentials: true,
}));

// 日志
if (NODE_ENV !== 'test') {
  app.use(morgan('[:date[iso]] :method :url :status :res[content-length] - :response-time ms'));
}

// 解析 JSON（但排除微信回调的 raw body）
app.use((req, res, next) => {
  if (req.path === '/api/pay/callback') {
    return next(); // 回调需要 raw body 验签
  }
  express.json()(req, res, next);
});

app.use(express.json());

// ============ 静态文件（前端） ============
app.use(express.static(STATIC_DIR));

// ============ API 路由 ============
app.use('/api/categories', require('./routes/category'));
app.use('/api/dishes', require('./routes/dish'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/pay', require('./routes/wxpay'));
app.use('/api/admin', require('./routes/admin'));

// ============ 健康检查 ============
// Railway 健康检查会访问根路径 /
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'restaurant-order-api' });
});

app.get('/api/health', (req, res) => {
  res.json({ code: 0, msg: 'ok', data: { version: '1.0.0', env: NODE_ENV } });
});

// ============ 404 处理 ============
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ code: 404, msg: '接口不存在', data: null });
  } else {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  }
});

// ============ 全局错误处理 ============
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ code: 500, msg: NODE_ENV === 'production' ? '服务器内部错误' : err.message, data: null });
});

// ============ 启动 ============
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🍜 味道鲜点单系统已启动`);
  console.log(`🌐 地址: http://localhost:${PORT}`);
  console.log(`📂 静态: ${STATIC_DIR}`);
  console.log(`🔧 环境: ${NODE_ENV}`);
  console.log(`💳 微信支付: ${require('./config').WX.isMock ? '⚠️ 模拟模式（未配置商户号）' : '✅ 真实模式'}\n`);
});

module.exports = app;
