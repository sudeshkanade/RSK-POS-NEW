@echo off
title RestroOS - Windows 8 Compatibility Launcher
color 0B
echo ==========================================================
echo           RESTROOS - WINDOWS 8 COMPATIBILITY LAUNCHER
echo ==========================================================
echo.

:: 1. Force Node.js to bypass Windows version validation check
set NODE_SKIP_PLATFORM_CHECK=1
echo [*] Enabled Windows 8 platform check bypass for Node.js.

:: 2. Check for Node.js installation
echo [*] Checking for Node.js installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js was not found!
    echo.
    echo To run RestroOS on Windows 8, you MUST install Node.js 18.x.
    echo Please download and install "Node.js v18.18.0" (or any v18.x) from:
    echo https://nodejs.org/dist/latest-v18.x/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

:: Display Node.js version
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [SUCCESS] Found Node.js version: %NODE_VER%

:: 3. Run installation if node_modules are missing
if not exist "node_modules" (
    echo [*] Installing workspace dependencies (this may take a few minutes)...
    call npm install
)

if not exist "apps\pos\node_modules" (
    echo [*] Installing POS dependencies...
    call npm install --workspace=@repo/pos
)

:: 4. Generate Prisma database client
echo [*] Generating Prisma Client...
set DATABASE_URL=file:./prisma/pos.db
cd apps\pos
call npx prisma generate
cd ..\..

:: 5. Build Next.js POS app if not built
if not exist "apps\pos\.next" (
    echo [*] POS application build not found. Compiling POS web assets...
    call npm run build --workspace=@repo/pos
)

:: 6. Launch POS Web Server
echo.
echo ==========================================================
echo  RestroOS local server is starting up...
echo  - Port: 3002
echo  - Local Database: apps/pos/prisma/pos.db
echo  - Browser URL: http://localhost:3002
echo ==========================================================
echo.
echo [Tip] If your default browser is outdated, we recommend installing 
echo       "Firefox ESR 115" or "Supermium" for maximum HTML5 compatibility.
echo.
echo [*] Automatically opening http://localhost:3002 in your default browser...
timeout /t 3 /nobreak >nul
start http://localhost:3002

:: Execute Next.js POS standalone server
cd apps\pos
set DATABASE_URL=file:./prisma/pos.db
node server-runner.js
pause
