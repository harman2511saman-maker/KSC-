@echo off
title OMR Frontend Server (Vite / React)
chcp 65001 >nul
set "PATH=C:\Users\Harma\AppData\Local\Programs\node-v20.18.0-win-x64;%PATH%"
cd /d "%~dp0frontend"

echo ======================================================
echo   دەستپێکردنی سێرڤەری فرۆنتئەند (Frontend - React)
echo ======================================================

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [هەڵە] Node.js / npm نەدۆزرایەوە!
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [1/2] دابەزاندنی پاکێجەکانی فرۆنتئەند (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        echo [هەڵە] کێشەیەک ڕوویدا لە npm install.
        pause
        exit /b 1
    )
)

echo [2/2] دەستپێکردنی Vite dev server...
echo پلاتفۆرم لە وێبگەڕ دەکرێتەوە لە: http://localhost:3000
echo ======================================================
call npm run dev
pause
