@echo off
chcp 65001 >nul
title B站余票监控 - 启动中...
color 0B

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║                                          ║
echo  ║        B站会员购余票监控 v1.0             ║
echo  ║                                          ║
echo  ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: 检查 node_modules 是否存在
if not exist "node_modules\" (
    echo  [提示] 首次运行，正在安装依赖...
    echo.
    call npm install
    echo.
    echo  [提示] 依赖安装完成！
    echo.
)

echo  [1/2] 启动后端服务...
start "B站余票监控-后端" /min cmd /c "node server/server.js"

echo  [2/2] 启动前端页面...
start "B站余票监控-前端" /min cmd /c "npx vite"

:: 等待服务启动
echo.
echo  等待服务启动...
timeout /t 3 /nobreak >nul

:: 打开浏览器
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║                                          ║
echo  ║   正在打开浏览器...                      ║
echo  ║                                          ║
echo  ║   访问地址: http://localhost:5173         ║
echo  ║                                          ║
echo  ║   关闭此窗口即可停止程序                  ║
echo  ║                                          ║
echo  ╚══════════════════════════════════════════╝
echo.

start http://localhost:5173

echo  程序已启动！按任意键停止并退出...
pause >nul

:: 停止所有相关进程
echo.
echo  正在停止服务...
taskkill /F /FI "WINDOWTITLE eq B站余票监控-后端" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq B站余票监控-前端" >nul 2>&1
:: 同时停止 node 和 vite 进程
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo  已停止，再见！
