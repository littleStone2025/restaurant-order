// 商家后台接口（需登录）
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

// ============ 中间件 ============
function auth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ code: 401, msg: '未登录', data: null });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ code: 401, msg: 'Token 无效', data: null });
  }
}

// ============ 登录 ============
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ code: 400, msg: '缺少参数', data: null });

  const admin = db.prepare('SELECT * FROM admins WHERE username = ? AND password = ?').get(username, password);
  if (!admin) return res.status(401).json({ code: 401, msg: '用户名或密码错误', data: null });

  const token = jwt.sign({ id: admin.id, username: admin.username, name: admin.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ code: 0, msg: '登录成功', data: { token, name: admin.name, username: admin.username } });
});

// ============ 菜品管理 ============
// 增
router.post('/dishes', auth, (req, res) => {
  const { category_id, name, description, price, emoji, tags, badge, sort_order, image_url } = req.body;
  if (!category_id || !name || !price) return res.status(400).json({ code: 400, msg: '缺少必填字段', data: null });
  try {
    const r = db.prepare(`
      INSERT INTO dishes (category_id, name, description, price, emoji, tags, badge, sort_order, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(category_id, name, description || '', price, emoji || '🍽️',
           JSON.stringify(tags || []), badge || null, sort_order || 0, image_url || '');
    res.json({ code: 0, msg: '菜品创建成功', data: { id: r.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

// 改
router.put('/dishes/:id', auth, (req, res) => {
  const { name, description, price, emoji, tags, badge, is_available, sort_order, image_url } = req.body;
  try {
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('name=?'); params.push(name); }
    if (description !== undefined) { fields.push('description=?'); params.push(description); }
    if (price !== undefined) { fields.push('price=?'); params.push(price); }
    if (emoji !== undefined) { fields.push('emoji=?'); params.push(emoji); }
    if (tags !== undefined) { fields.push('tags=?'); params.push(JSON.stringify(tags)); }
    if (badge !== undefined) { fields.push('badge=?'); params.push(badge); }
    if (is_available !== undefined) { fields.push('is_available=?'); params.push(is_available); }
    if (sort_order !== undefined) { fields.push('sort_order=?'); params.push(sort_order); }
    if (image_url !== undefined) { fields.push('image_url=?'); params.push(image_url); }

    if (fields.length === 0) return res.status(400).json({ code: 400, msg: '无更新字段', data: null });
    params.push(req.params.id);
    const result = db.prepare(`UPDATE dishes SET ${fields.join(',')} WHERE id=?`).run(...params);
    if (result.changes === 0) return res.status(404).json({ code: 404, msg: '菜品不存在', data: null });
    res.json({ code: 0, msg: '更新成功', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

// 删（软删）
router.delete('/dishes/:id', auth, (req, res) => {
  const result = db.prepare('UPDATE dishes SET is_deleted = 1 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ code: 404, msg: '菜品不存在', data: null });
  res.json({ code: 0, msg: '删除成功', data: null });
});

// 查
router.get('/dishes', auth, (req, res) => {
  const { category_id, is_available, page = 1, pageSize = 50 } = req.query;
  try {
    let sql = 'SELECT d.*, c.name as category_name FROM dishes d LEFT JOIN categories c ON c.id=d.category_id WHERE d.is_deleted=0';
    const params = [];
    if (category_id) { sql += ' AND d.category_id=?'; params.push(category_id); }
    if (is_available !== undefined) { sql += ' AND d.is_available=?'; params.push(is_available); }
    sql += ' ORDER BY d.sort_order, d.id';
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    sql += ` LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;
    const rows = db.prepare(sql).all(...params).map(d => ({ ...d, tags: JSON.parse(d.tags || '[]') }));
    res.json({ code: 0, msg: 'success', data: rows });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

// ============ 分类管理 ============
router.post('/categories', auth, (req, res) => {
  const { name, emoji, badge, sort_order } = req.body;
  if (!name || !emoji) return res.status(400).json({ code: 400, msg: '缺少 name 或 emoji', data: null });
  try {
    const r = db.prepare('INSERT INTO categories (name, emoji, badge, sort_order) VALUES (?, ?, ?, ?)')
      .run(name, emoji, badge || null, sort_order || 0);
    res.json({ code: 0, msg: '分类创建成功', data: { id: r.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

router.put('/categories/:id', auth, (req, res) => {
  const { name, emoji, badge, sort_order } = req.body;
  try {
    const fields = [], params = [];
    if (name !== undefined) { fields.push('name=?'); params.push(name); }
    if (emoji !== undefined) { fields.push('emoji=?'); params.push(emoji); }
    if (badge !== undefined) { fields.push('badge=?'); params.push(badge); }
    if (sort_order !== undefined) { fields.push('sort_order=?'); params.push(sort_order); }
    if (!fields.length) return res.status(400).json({ code: 400, msg: '无更新字段', data: null });
    params.push(req.params.id);
    const result = db.prepare(`UPDATE categories SET ${fields.join(',')} WHERE id=?`).run(...params);
    if (result.changes === 0) return res.status(404).json({ code: 404, msg: '分类不存在', data: null });
    res.json({ code: 0, msg: '更新成功', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

// ============ 统计数据 ============
router.get('/stats', auth, (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const stats = {
      todayOrders: db.prepare(`SELECT COUNT(*) as c, COALESCE(SUM(total),0) as amount FROM orders WHERE DATE(created_at) = ? AND pay_status='paid'`).get(today),
      totalOrders: db.prepare(`SELECT COUNT(*) as c, COALESCE(SUM(total),0) as amount FROM orders WHERE pay_status='paid'`).get(),
      pendingOrders: db.prepare(`SELECT COUNT(*) as c FROM orders WHERE pay_status='paid' AND status != 'done'`).get(),
      totalDishes: db.prepare(`SELECT COUNT(*) as c FROM dishes WHERE is_deleted=0`).get(),
      totalCategories: db.prepare(`SELECT COUNT(*) as c FROM categories WHERE is_deleted=0`).get(),
    };
    res.json({ code: 0, msg: 'success', data: stats });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

// 近 7 天每日订单统计
router.get('/stats/daily', auth, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const result = {};
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().slice(0, 10);
      const row = db.prepare(`
        SELECT COUNT(*) as c FROM orders 
        WHERE DATE(created_at) = ? AND pay_status='paid'
      `).get(date);
      result[date] = row.c;
    }
    
    res.json({ code: 0, msg: 'success', data: result });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

module.exports = router;
