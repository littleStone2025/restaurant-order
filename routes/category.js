// 分类接口
const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/categories
router.get('/', (req, res) => {
  try {
    const cats = db.prepare(`
      SELECT c.*, COUNT(d.id) as dish_count
      FROM categories c
      LEFT JOIN dishes d ON d.category_id = c.id AND d.is_deleted = 0 AND d.is_available = 1
      WHERE c.is_deleted = 0
      GROUP BY c.id
      ORDER BY c.sort_order
    `).all();
    res.json({ code: 0, msg: 'success', data: cats });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

// GET /api/categories/:id
router.get('/:id', (req, res) => {
  try {
    const cat = db.prepare(
      'SELECT * FROM categories WHERE id = ? AND is_deleted = 0'
    ).get(req.params.id);
    if (!cat) return res.status(404).json({ code: 404, msg: '分类不存在', data: null });
    res.json({ code: 0, msg: 'success', data: cat });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('UPDATE categories SET is_deleted = 1 WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ code: 404, msg: '分类不存在', data: null });
    // 同时将菜品设置为未分类
    db.prepare('UPDATE dishes SET category_id = 0 WHERE category_id = ?').run(req.params.id);
    res.json({ code: 0, msg: '删除成功', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

module.exports = router;
