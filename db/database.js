// 数据库初始化
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { DB_PATH } = require('../config');

// 确保目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);

// 启用外键约束
db.pragma('foreign_keys = ON');
// WAL 模式提升并发性能
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

module.exports = db;
