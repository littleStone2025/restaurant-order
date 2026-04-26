@echo off
:: Windows 一键启动脚本
:: 用法: 双击 start.bat 或在命令行运行 start.bat [端口]

set PORT=%1
if "%PORT%"=="" set PORT=3000

echo.
echo  🍜 味道鲜餐厅点单系统启动中...
echo  📂 当前目录: %CD%
echo.

:: 检查 Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo  ❌ 错误: 未找到 Node.js
    echo  请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

for /f "delims=" %%v in ('node --version') do set NODE_VERSION=%%v
echo  ✅ Node.js %NODE_VERSION%

:: 检查依赖
if not exist "node_modules" (
    echo  📦 安装依赖...
    call npm install
)

:: 复制环境变量
if not exist ".env" (
    copy .env.example .env >nul 2>&1
    echo  ✅ 已创建 .env 文件
)

echo.
echo  🚀 启动服务（端口 %PORT%）...
echo  🌐 前台点单: http://localhost:%PORT%
echo  🔧 后台管理: http://localhost:%PORT%/admin.html
echo.
echo  按 Ctrl+C 停止服务
echo.

set PORT=%PORT%
node server.js
