FROM node:20-alpine

WORKDIR /app

# 安装 node-gyp 编译所需的构建工具
RUN apk add --no-cache python3 make g++

# 安装依赖（利用缓存）
COPY package*.json ./
RUN npm ci --omit=dev

# 复制源代码
COPY . .

# 创建数据目录
RUN mkdir -p data

# Railway 使用 PORT 环境变量
ENV PORT=3000
EXPOSE $PORT

# 健康检查 - 使用根路径
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/ || exit 1

# 启动 - 使用 PORT 环境变量
CMD ["node", "server.js"]
