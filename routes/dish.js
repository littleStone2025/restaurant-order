// 菜品接口
const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/dishes — 菜品列表
router.get('/', (req, res) => {
  try {
    const { category_id, available, keyword } = req.query;
    let sql = `SELECT * FROM dishes WHERE is_deleted = 0`;
    const params = [];

    if (category_id) {
      sql += ' AND category_id = ?';
      params.push(category_id);
    }
    if (available !== undefined) {
      sql += ' AND is_available = ?';
      params.push(available === '1' ? 1 : 0);
    }
    if (keyword) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    sql += ' ORDER BY sort_order, id';

    const dishes = db.prepare(sql).all(...params);
    // 解析 tags JSON
    const result = dishes.map(d => ({ ...d, tags: JSON.parse(d.tags || '[]') }));
    res.json({ code: 0, msg: 'success', data: result });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

// GET /api/dishes/:id — 菜品详情
router.get('/:id', (req, res) => {
  try {
    const dish = db.prepare(
      'SELECT * FROM dishes WHERE id = ? AND is_deleted = 0'
    ).get(req.params.id);
    if (!dish) return res.status(404).json({ code: 404, msg: '菜品不存在', data: null });
    res.json({ code: 0, msg: 'success', data: { ...dish, tags: JSON.parse(dish.tags || '[]') } });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

module.exports = router;
