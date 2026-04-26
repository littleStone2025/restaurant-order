# 味道鲜 · 餐厅点单系统

> 轻量级网页版餐厅自助点单系统，支持菜单浏览、购物车、微信支付（JSAPI）、商家后台管理。

## 🚀 快速启动

### 方式一：一键启动（推荐）

**Windows:**
```bash
双击运行 start.bat
```

**Linux/macOS:**
```bash
bash start.sh
```

### 方式二：Docker 部署

```bash
docker-compose up -d
```

### 方式三：手动启动

```bash
npm install
cp .env.example .env   # 编辑填入真实配置
node server.js
```

启动后访问：
- 🍜 **前台点单**: http://localhost:3000
- 🔧 **商家后台**: http://localhost:3000/admin.html（账号 `admin` / 密码 `admin123`）

---

## 📁 项目结构

```
restaurant-order/
├── server.js              # Node.js 主服务入口
├── config/index.js        # 环境配置
├── db/
│   ├── database.js        # SQLite 连接
│   └── schema.js         # 建表 + 种子数据
├── routes/
│   ├── category.js        # 分类 API
│   ├── dish.js            # 菜品 API
│   ├── order.js           # 订单 API
│   ├── wxpay.js           # 微信支付 API
│   └── admin.js           # 商家后台 API（需登录）
├── services/
│   └── wxpay.js          # 微信支付服务（含模拟模式）
├── public/
│   ├── index.html         # 顾客点单前台
│   └── admin.html         # 商家管理后台
├── Dockerfile
├── docker-compose.yml
├── start.sh              # Linux/macOS 启动脚本
├── start.bat             # Windows 启动脚本
└── .env.example          # 环境变量示例
```

---

## 🔌 API 接口一览

| 接口 | Method | 说明 |
|------|--------|------|
| `/api/health` | GET | 健康检查 |
| `/api/categories` | GET | 分类列表（含菜品数） |
| `/api/dishes?available=1` | GET | 菜品列表 |
| `/api/dishes/:id` | GET | 菜品详情 |
| `/api/orders` | GET | 订单列表 |
| `/api/orders` | POST | 创建订单 |
| `/api/orders/:id` | GET | 订单详情 |
| `/api/orders/:id/status` | PATCH | 更新订单状态 |
| `/api/pay/mock/create` | POST | 模拟支付（开发用） |
| `/api/pay/create` | POST | 微信 JSAPI 统一下单 |
| `/api/pay/callback` | POST | 微信支付回调 |
| `/api/admin/login` | POST | 后台登录 |
| `/api/admin/dishes` | GET/POST/PUT/DELETE | 菜品管理 |
| `/api/admin/categories` | GET/POST/PUT | 分类管理 |
| `/api/admin/stats` | GET | 数据统计 |

---

## 💳 微信支付配置

### 开发环境（模拟模式）

无需配置，`.env.example` 留空即可使用模拟支付，下单时自动走 `/api/pay/mock/create`。

### 生产环境（真实支付）

1. 申请微信商户号（JSAPI）
2. 在微信商户平台配置：
   - JSAPI 支付目录
   - H5 支付域名
   - 下载平台证书
3. 填入 `.env`：

```env
WX_MCHID=your_mchid
WX_APPID=your_appid
WX_APPSECRET=your_appsecret
WX_SERIAL_NO=your_serial_no
WX_PRIVATE_KEY_PATH=./certs/apiclient_key.pem
WX_PLATFORM_CERT_PATH=./certs/wechatpay_cert.pem
WX_PAY_NOTIFY_URL=https://your-domain.com/api/pay/callback
```

> ⚠️ 注意：微信支付必须在**已备案域名**的环境下使用（生产环境需 HTTPS + 公网可访问的回调地址）。

---

## 🧪 测试账号

| 系统 | 账号 | 密码 |
|------|------|------|
| 商家后台 | `admin` | `admin123` |

---

## 📦 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + Vanilla JS（零框架） |
| 后端 | Node.js + Express |
| 数据库 | SQLite 3（可通过 `better-sqlite3` 替换为 MySQL） |
| 缓存 | 内存 Map（Redis 可选） |
| 支付 | 微信支付 V3 API（JSAPI） |
| 部署 | Docker + Docker Compose |

---

## 📄 许可证

MIT
