// 配置文件
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DB_PATH = process.env.DB_PATH || './data/restaurant.db';

const WX = {
  mchid: process.env.WX_MCHID || '',
  appid: process.env.WX_APPID || '',
  appsecret: process.env.WX_APPSECRET || '',
  serialNo: process.env.WX_SERIAL_NO || '',
  privateKeyPath: process.env.WX_PRIVATE_KEY_PATH || '',
  platformCertPath: process.env.WX_PLATFORM_CERT_PATH || '',
  payNotifyUrl: process.env.WX_PAY_NOTIFY_URL || '',
  jsDomain: process.env.WX_JS_DOMAIN || '',
  isMock: !process.env.WX_MCHID,
};

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const STATIC_DIR = process.env.STATIC_DIR || './public';

module.exports = { PORT, NODE_ENV, DB_PATH, WX, JWT_SECRET, STATIC_DIR };
