@echo off
setlocal EnableExtensions
title Bili Ticket Monitor
cd /d "%~dp0"

set "PORT=3001"
set "ROOT=%~dp0"
set "OWNED=0"

echo.
echo  ==============================================
echo     Bilibili Ticket Monitor
echo  ==============================================
echo.

rem ---------- 1. resolve Node.js runtime ----------
if exist "%ROOT%runtime\node.exe" (
    set "NODE=%ROOT%runtime\node.exe"
    echo  [OK] Using bundled Node.js runtime
) else (
    set "NODE=node"
    echo  [..] Bundled runtime missing, falling back to system Node.js
    where node >nul 2>nul
    if errorlevel 1 goto :no_node
)

rem ---------- 2. check the files this launcher needs ----------
if not exist "%ROOT%server\server.js" goto :broken_install
if not exist "%ROOT%dist\index.html" goto :need_build

rem ---------- 3. attach to an instance that is already running ----------
call :check_port
if "%UP%"=="1" (
    echo.
    echo  [!] Port %PORT% is already used by a running monitor instance.
    echo      Opening it directly instead of starting a second one...
    start http://localhost:%PORT%
    goto :watch
)

rem ---------- 4. start the local server ----------
echo  [1/3] Starting local server...
start "bili-monitor-server" /min "%NODE%" "%ROOT%server\server.js"
set "OWNED=1"

echo  [2/3] Waiting for the server to become ready...
set "WAITED=0"
:wait_ready
call :check_port
if "%UP%"=="1" goto :ready
rem ping is used instead of "timeout" because timeout.exe refuses to run
rem when stdin is not a console, which would turn these waits into spin loops.
ping -n 2 127.0.0.1 >nul
set /a WAITED+=1
if %WAITED% geq 30 goto :start_failed
goto :wait_ready

:ready
echo  [3/3] Server is ready. Opening browser...
start http://localhost:%PORT%
echo.
echo  Monitoring now. Close the browser tab to stop.
echo  Keep this window open until it exits by itself.
echo.

:watch
ping -n 3 127.0.0.1 >nul
call :check_port
if "%UP%"=="1" goto :watch

echo.
echo  Server stopped. Cleaning up...
if not "%OWNED%"=="1" goto :done

rem Re-read the port owner here instead of reusing an old PID, because a
rem stale PID may already belong to an unrelated process.
call :check_port
if not "%UP%"=="1" goto :kill_window
echo      Something still holds port %PORT%, terminating it...
taskkill /f /pid %SRVPID% >nul 2>nul

:kill_window
taskkill /f /fi "WINDOWTITLE eq bili-monitor-server" >nul 2>nul

:done
echo  Done.
ping -n 3 127.0.0.1 >nul
goto :eof

rem ================= helpers =================
:check_port
set "UP=0"
set "SRVPID="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /c:":%PORT% " ^| findstr "LISTENING"') do (
    set "UP=1"
    set "SRVPID=%%a"
)
goto :eof

:no_node
echo.
echo  [ERROR] No Node.js runtime found.
echo          Expected here: %ROOT%runtime\node.exe
echo          Or install Node.js 18+ so that the "node" command works.
echo.
pause
goto :eof

:need_build
echo.
echo  [ERROR] The web UI is not built yet: dist\index.html is missing.
echo  This looks like a source clone, not a downloaded release. Run:
echo      npm install
echo      npm run build
echo  Then double-click this file again.
echo.
pause
goto :eof

:broken_install
echo.
echo  [ERROR] server\server.js is missing.
echo          This folder is not a complete copy of the monitor.
echo          Re-extract the downloaded zip, or re-clone the repository.
echo.
pause
goto :eof

:start_failed
echo.
echo  [ERROR] Server did not become ready within 30 seconds.
echo  Common causes:
echo    - Antivirus or Windows Defender blocked the Node.js runtime
echo    - The bundled runtime does not match this Windows version
echo  To see the real error message, run this from the folder:
echo      "%NODE%" "%ROOT%server\server.js"
echo.
pause
goto :eof
