// 微信支付接口
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { createJsapiOrder, verifyCallback } = require('../services/wxpay');
const { WX } = require('../config');

// POST /api/pay/create — 创建支付订单
router.post('/create', async (req, res) => {
  const { orderId, openid } = req.body;

  if (!orderId) return res.status(400).json({ code: 400, msg: '缺少 orderId', data: null });

  try {
    const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId);
    if (!order) return res.status(404).json({ code: 404, msg: '订单不存在', data: null });
    if (order.pay_status === 'paid') return res.status(400).json({ code: 400, msg: '订单已支付', data: null });

    // 金额转分为单位（微信支付最小单位）
    const totalFee = Math.round(parseFloat(order.total) * 100);

    const payParams = await createJsapiOrder({
      orderId,
      openid: openid || order.wx_openid,
      totalFee,
      description: `味道鲜餐厅-订单${orderId}`,
      notifyUrl: WX.payNotifyUrl,
    });

    res.json({ code: 0, msg: 'success', data: payParams });
  } catch (err) {
    console.error('创建支付失败:', err.message);
    res.status(500).json({ code: 500, msg: '支付创建失败: ' + err.message, data: null });
  }
});

// POST /api/pay/callback — 微信支付回调
router.post('/callback', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const body = JSON.parse(req.body.toString());
    const headers = req.headers;

    // 验签（生产环境需验证）
    if (!verifyCallback(headers, body)) {
      return res.status(400).json({ code: 'FAIL', message: '签名验证失败' });
    }

    const { transaction_id, out_trade_no, trade_state, total } = body.resource || {};

    if (trade_state === 'SUCCESS') {
      const result = db.prepare(`
        UPDATE orders SET pay_status = 'paid', wx_pay_id = ?, status = 'cooking', paid_at = CURRENT_TIMESTAMP
        WHERE order_id = ?
      `).run(transaction_id || out_trade_no, out_trade_no);

      if (result.changes > 0) {
        console.log(`✅ 订单 ${out_trade_no} 支付成功`);
      }
    }

    res.json({ code: 'SUCCESS', message: '成功接收回调' });
  } catch (err) {
    console.error('回调处理失败:', err.message);
    res.json({ code: 'FAIL', message: err.message });
  }
});

// GET /api/pay/mock/create — 模拟支付（开发环境无需配置商户号）
router.post('/mock/create', async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ code: 400, msg: '缺少 orderId', data: null });

  try {
    const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId);
    if (!order) return res.status(404).json({ code: 404, msg: '订单不存在', data: null });

    // 直接标记为已支付（模拟）
    db.prepare(`
      UPDATE orders SET pay_status = 'paid', status = 'cooking',
      wx_pay_id = 'mock_' || ?,
      paid_at = CURRENT_TIMESTAMP
      WHERE order_id = ?
    `).run(Date.now().toString(), orderId);

    res.json({
      code: 0, msg: '模拟支付成功', data: {
        order_id: orderId,
        pay_status: 'paid',
        total: order.total,
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message, data: null });
  }
});

module.exports = router;
