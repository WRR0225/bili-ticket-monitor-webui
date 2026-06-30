@echo off
chcp 65001 >nul
title B站余票监控
color 0B

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║                                          ║
echo  ║        B站会员购余票监控                  ║
echo  ║                                          ║
echo  ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"

if not exist "node_modules\" (
    echo  Installing dependencies...
    echo.
    call npm install
    echo.
    echo  Done!
    echo.
)

echo  [1/2] Starting backend...
start "bili-backend" /min cmd /c "node server/server.js"

echo  [2/2] Starting frontend...
start "bili-frontend" /min cmd /c "npx vite"

echo.
echo  Waiting...
timeout /t 3 /nobreak >nul

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║                                          ║
echo  ║   Opening browser...                     ║
echo  ║                                          ║
echo  ║   http://localhost:5173                   ║
echo  ║                                          ║
echo  ║   Close browser to stop                   ║
echo  ║                                          ║
echo  ╚══════════════════════════════════════════╝
echo.

start http://localhost:5173

echo  Server running. Close browser to auto-stop...

:monitor
timeout /t 2 /nobreak >nul

tasklist /FI "WINDOWTITLE eq bili-backend" 2>nul | find /I "cmd.exe" >nul
if errorlevel 1 (
    goto :stop
)
goto :monitor

:stop
echo  Stopping...
taskkill /F /FI "WINDOWTITLE eq bili-backend" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq bili-frontend" >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo  Done.
timeout /t 2 /nobreak >nul
