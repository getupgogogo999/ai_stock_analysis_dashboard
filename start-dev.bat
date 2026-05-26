@echo off
REM 一键启动开发环境（需先安装 Node.js 并配置 .env）
echo === 安全检查 ===
node scripts\verify-security.js
if errorlevel 1 exit /b 1

echo.
echo === 检查 .env 密钥 ===
node scripts\check-env.js
if errorlevel 1 exit /b 1

echo.
echo === 安装依赖 ===
call npm run install:all
if errorlevel 1 exit /b 1

echo.
echo === API 连接测试 ===
node scripts\smoke-test.js
if errorlevel 1 exit /b 1

echo.
echo === 启动后端 (port 3001) ===
echo 请另开一个终端运行: npm run dev:client
start "Stock API Server" cmd /k npm run dev:server
