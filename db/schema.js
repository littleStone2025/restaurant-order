// 建表 + 种子数据
const db = require('./database');

function initSchema() {
  db.exec(`
    -- 分类表
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      badge TEXT DEFAULT NULL,
      sort_order INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 菜品表
    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL,
      image_url TEXT DEFAULT '',
      emoji TEXT DEFAULT '🍽️',
      tags TEXT DEFAULT '[]',
      badge TEXT DEFAULT NULL,
      is_available INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    -- 订单表
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      table_no TEXT NOT NULL,
      items TEXT NOT NULL,
      note TEXT DEFAULT '',
      sub_total REAL NOT NULL,
      service_fee REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      pay_status TEXT DEFAULT 'unpaid',
      wx_pay_id TEXT DEFAULT '',
      wx_openid TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      paid_at DATETIME
    );

    -- 管理员表
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 操作日志表
    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      action TEXT NOT NULL,
      detail TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 索引
    CREATE INDEX IF NOT EXISTS idx_dishes_cat ON dishes(category_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_pay ON orders(pay_status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
  `);
  console.log('✅ 表结构创建完成');
}

function seedData() {
  const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
  if (catCount > 0) {
    console.log('⏩ 数据已存在，跳过初始化');
    return;
  }

  // 插入分类
  const insertCat = db.prepare(
    'INSERT INTO categories (name, emoji, badge, sort_order) VALUES (?, ?, ?, ?)'
  );
  const categories = [
    ['今日特供', '🔥', 'hot', 1],
    ['凉菜前菜', '🥗', null, 2],
    ['主菜热炒', '🍳', null, 3],
    ['汤羹煲类', '🍲', null, 4],
    ['主食面条', '🍜', null, 5],
    ['烧烤炸串', '🍢', null, 6],
    ['饮品甜品', '🧋', null, 7],
  ];
  const catIds = {};
  const insertCats = db.transaction(() => {
    for (const [name, emoji, badge, order] of categories) {
      const r = insertCat.run(name, emoji, badge, order);
      catIds[name] = r.lastInsertRowid;
    }
  });
  insertCats();

  // 插入菜品
  const insertDish = db.prepare(
    `INSERT INTO dishes (category_id, name, description, price, emoji, tags, badge, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const dishes = [
    // 今日特供
    [catIds['今日特供'], '招牌红烧肉', '精选五花肉慢炖2小时，色泽红亮，入口即化，配秘制酱汁', 68, '🥩', '["招牌","限时"]', 'hot', 1],
    [catIds['今日特供'], '季节时蔬炒鸡蛋', '今日采摘新鲜时蔬，嫩滑土鸡蛋，简单健康', 28, '🍳', '["限时","清淡"]', 'new', 2],
    [catIds['今日特供'], '秘制卤味拼盘', '鸭脖、猪耳、豆干精心卤制，香辣入味，6种组合', 88, '🍗', '["招牌","必点"]', 'rec', 3],
    // 凉菜前菜
    [catIds['凉菜前菜'], '手撕鸡丝凉面', '嫩滑鸡胸肉手撕，配芝麻酱与黄瓜丝，清爽开胃', 32, '🍝', '["凉菜","低脂"]', null, 1],
    [catIds['凉菜前菜'], '拍黄瓜', '新鲜嫩黄瓜，蒜泥醋汁，清脆爽口', 18, '🥒', '["开胃","素食"]', null, 2],
    [catIds['凉菜前菜'], '麻辣素什锦', '藕片、木耳、银芽、豆干，麻辣鲜香', 24, '🥬', '["素食","辣"]', null, 3],
    [catIds['凉菜前菜'], '老醋皮蛋', '松花蛋配陈醋腌制，咸鲜微酸，下饭神器', 22, '🥚', '["下饭"]', null, 4],
    // 主菜热炒
    [catIds['主菜热炒'], '水煮鱼片', '草鱼片嫩滑Q弹，红汤麻辣鲜香，满溢花椒香气', 78, '🐟', '["辣","招牌"]', 'hot', 1],
    [catIds['主菜热炒'], '宫保鸡丁', '鸡腿肉丁配花生米、干辣椒，酸甜辣平衡经典', 52, '🍗', '["经典","下饭"]', null, 2],
    [catIds['主菜热炒'], '西红柿炒鸡蛋', '国民家常菜，新鲜番茄酸甜，嫩蛋滑润', 28, '🍅', '["家常","素食"]', null, 3],
    [catIds['主菜热炒'], '干煸豆角', '豆角炸至表皮起皱，与肉末干辣椒爆炒，焦香入味', 32, '🫘', '["下饭","微辣"]', null, 4],
    [catIds['主菜热炒'], '清蒸鲈鱼', '活鲈鱼清蒸，淋热油激香，鱼肉细嫩清甜', 128, '🐠', '["清淡","鲜"]', 'rec', 5],
    [catIds['主菜热炒'], '回锅肉', '二刀肉炒至灯盏窝，青椒豆瓣酱提鲜，浓香下饭', 48, '🥓', '["川菜","下饭"]', null, 6],
    // 汤羹
    [catIds['汤羹煲类'], '番茄蛋花汤', '酸甜番茄与嫩滑蛋花，清淡开胃，暖胃养身', 18, '🍅', '["汤","清淡"]', null, 1],
    [catIds['汤羹煲类'], '老鸭汤', '老鸭小火慢炖4小时，汤色金黄，滋补暖身', 98, '🦆', '["滋补","推荐"]', 'rec', 2],
    [catIds['汤羹煲类'], '酸辣汤', '木耳、豆腐、鸡蛋，酸辣适中，开胃暖身', 22, '🥣', '["汤","酸辣"]', null, 3],
    // 主食
    [catIds['主食面条'], '招牌炒饭', '隔夜米饭大火翻炒，蛋香四溢，粒粒分明', 28, '🍚', '["主食","经典"]', null, 1],
    [catIds['主食面条'], '重庆小面', '细面配秘制红油，花椒葱花，麻辣鲜香地道正宗', 24, '🍜', '["主食","麻辣"]', 'hot', 2],
    [catIds['主食面条'], '牛肉拉面', '手工拉面配慢炖牛肉，汤底浓厚，大块牛腩', 38, '🍖', '["主食","牛肉"]', null, 3],
    [catIds['主食面条'], '扬州炒饭', '火腿、虾仁、鸡蛋，经典配料飘香', 32, '🍳', '["主食","经典"]', 'rec', 4],
    // 烧烤
    [catIds['烧烤炸串'], '烤羊肉串', '新疆羔羊肉，孜然辣椒提味，炭火烤制香嫩', 6, '🍢', '["串串","辣"]', 'hot', 1],
    [catIds['烧烤炸串'], '炸鸡米花', '嫩鸡腿肉裹粉炸至金黄，外酥里嫩', 28, '🍗', '["炸物","下酒"]', null, 2],
    [catIds['烧烤炸串'], '烤玉米', '甜玉米刷黄油烤至微焦，清甜香糯', 12, '🌽', '["素食","甜"]', null, 3],
    // 饮品
    [catIds['饮品甜品'], '冰镇柠檬茶', '鲜榨柠檬，蜂蜜调配，冰爽解腻', 18, '🍋', '["冷饮","解腻"]', null, 1],
    [catIds['饮品甜品'], '珍珠奶茶', '香浓奶茶配Q弹珍珠，甜度可调', 22, '🧋', '["冷饮","甜品"]', 'new', 2],
    [catIds['饮品甜品'], '杨枝甘露', '芒果沙冰配西柚椰汁，港式经典甜品', 28, '🥭', '["甜品","冷饮"]', null, 3],
  ];

  const insertDishes = db.transaction(() => {
    for (const d of dishes) insertDish.run(...d);
  });
  insertDishes();

  // 插入默认管理员 (密码: admin123)
  // bcrypt hash for 'admin123' - in dev just use plain
  db.prepare(
    "INSERT OR IGNORE INTO admins (username, password, name) VALUES (?, ?, ?)"
  ).run('admin', 'admin123', '管理员');

  console.log('✅ 种子数据初始化完成');
}

module.exports = { initSchema, seedData };
