// 微信支付服务
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const { WX } = require('../config');

const BASE_URL = 'https://api.mch.weixin.qq.com';

// 构造签名（API v3）
function sign(params, signStr) {
  const { privateKeyPath } = WX;
  if (!privateKeyPath || !fs.existsSync(privateKeyPath)) return null;
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signStr);
  return sign.sign(privateKey, 'base64');
}

// 统一下单（JSAPI）
async function createJsapiOrder({ orderId, openid, totalFee, description, notifyUrl }) {
  // 模拟模式：直接返回成功
  if (WX.isMock) {
    return {
      mock: true,
      prepay_id: `mock_prepay_${Date.now()}`,
      paySign: 'mock_signature',
    };
  }

  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const url = `${BASE_URL}/v3/pay/transactions/jsapi`;

  const params = {
    appid: WX.appid,
    mchid: WX.mchid,
    description,
    out_trade_no: orderId,
    notify_url: notifyUrl,
    amount: { total: totalFee, currency: 'CNY' },
    payer: { openid },
  };

  // API v3 签名
  const signStr = `${params.appid}\n${timeStamp}\n${nonceStr}\n${JSON.stringify(params)}\n`;
  const signature = sign(null, signStr);

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `WECHATPAY2-SHA256-RSA2048 `
      + `mchid="${WX.mchid}",`
      + `serial_no="${WX.serialNo}",`
      + `nonce_str="${nonceStr}",`
      + `signature="${signature}",`
      + `timestamp="${timeStamp}"`,
  };

  const resp = await axios.post(url, params, { headers, timeout: 10000 });
  const prepayId = resp.data?.prepay_id;
  if (!prepayId) throw new Error('统一下单失败: ' + JSON.stringify(resp.data));

  // 前端调起支付的签名
  const paySignStr = `${WX.appid}\n${timeStamp}\n${nonceStr}\nprepay_id=${prepayId}\n`;
  const paySignature = sign(null, paySignStr);

  return {
    prepay_id: prepayId,
    appId: WX.appid,
    timeStamp,
    nonceStr,
    package: `prepay_id=${prepayId}`,
    signType: 'RSA',
    paySign: paySignature,
  };
}

// 查询订单支付状态
async function queryOrder(transactionId) {
  if (WX.isMock) return { trade_state: 'SUCCESS' };

  const url = `${BASE_URL}/v3/pay/transactions/id/${transactionId}?mchid=${WX.mchid}`;
  // 实现查询逻辑...
  return null;
}

// 回调验签（简化版）
function verifyCallback(headers, body) {
  if (WX.isMock) return true;
  // 生产环境需用平台证书验签
  return true;
}

module.exports = { createJsapiOrder, queryOrder, verifyCallback };
