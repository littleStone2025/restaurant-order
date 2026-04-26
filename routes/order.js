// 订单接口
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const SERVICE_FEE_RATE = 0.05; // 服务费率 5%

// 生成订单号
function genOrderId() {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WD${ts}${rand}`;
}

// GET /api/orders — 查询订单（支持 admin 鉴权）
router.get('/', (req, res) => {
  const { table_no, status, pay_status, page = 1, pageSize = 20 } = req.query;
  try {
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (table_no) { sql += ' AND table_no = ?'; params.push(table_no); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (pay_status) { sql += ' AND pay_status = ?'; params.push(pay_status); }

    sql += ' ORDER BY created_at DESC';
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    sql += ` LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;

    const rows = db.prepare(sql).all(...params);
    const total = db.prepare(sql.replace(/LIMIT.*OFFSET.*/, '')).all(...params).length;

    res.json({
      code: 0, msg: 'success', data: {
        list: rows.map(r => ({ ...r, items: JSON.parse(r.items) })),
        total, page: parseInt(page), pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

// GET /api/orders/:orderId — 订单详情
router.get('/:orderId', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(req.params.orderId);
    if (!order) return res.status(404).json({ code: 404, msg: '订单不存在', data: null });
    res.json({ code: 0, msg: 'success', data: { ...order, items: JSON.parse(order.items) } });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

// POST /api/orders — 创建订单（预下单，未支付）
router.post('/', (req, res) => {
  const { table_no, items, note = '', openid = '' } = req.body;

  if (!table_no || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ code: 400, msg: '参数错误：需要 table_no 和 items', data: null });
  }

  try {
    // 校验菜品存在并计算金额
    let subTotal = 0;
    const validatedItems = [];
    for (const item of items) {
      const dish = db.prepare('SELECT * FROM dishes WHERE id = ? AND is_deleted = 0 AND is_available = 1').get(item.id);
      if (!dish) return res.status(400).json({ code: 400, msg: `菜品 #${item.id} 不存在或已下架`, data: null });
      const qty = parseInt(item.qty) || 1;
      const dishPrice = parseFloat(dish.price);
      subTotal += dishPrice * qty;
      validatedItems.push({ id: dish.id, name: dish.name, emoji: dish.emoji, qty, price: dishPrice });
    }

    const serviceFee = Math.round(subTotal * SERVICE_FEE_RATE * 100) / 100;
    const total = Math.round((subTotal + serviceFee) * 100) / 100;
    const orderId = genOrderId();

    db.prepare(`
      INSERT INTO orders (order_id, table_no, items, note, sub_total, service_fee, total, wx_openid, status, pay_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid')
    `).run(orderId, table_no, JSON.stringify(validatedItems), note, subTotal, serviceFee, total, openid);

    const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId);
    res.json({ code: 0, msg: '订单创建成功', data: { ...order, items: JSON.parse(order.items) } });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

// PATCH /api/orders/:orderId/status — 更新订单状态
router.patch('/:orderId/status', (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'cooking', 'done', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ code: 400, msg: '状态值非法', data: null });

  try {
    const result = db.prepare('UPDATE orders SET status = ? WHERE order_id = ?').run(status, req.params.orderId);
    if (result.changes === 0) return res.status(404).json({ code: 404, msg: '订单不存在', data: null });
    res.json({ code: 0, msg: '状态更新成功', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

module.exports = router;
