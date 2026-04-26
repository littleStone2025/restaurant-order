#!/bin/bash
# 启动脚本（Linux/macOS）
# 用法: bash start.sh

PORT=${1:-3000}

echo "🍜 味道鲜餐厅点单系统启动中..."
echo "📂 当前目录: $(pwd)"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version)"

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 复制环境变量
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ 已创建 .env 文件，请根据需要修改"
fi

# 启动服务
echo "🚀 启动服务（端口 $PORT）..."
echo "🌐 前台点单: http://localhost:$PORT"
echo "🔧 后台管理: http://localhost:$PORT/admin.html"
echo ""

PORT=$PORT node server.js
