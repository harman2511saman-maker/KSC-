@echo off
title OMR Backend Server (FastAPI)
chcp 65001 >nul
set "PATH=C:\Users\Harma\AppData\Local\Programs\Python\Python311;C:\Users\Harma\AppData\Local\Programs\Python\Python311\Scripts;%PATH%"
cd /d "%~dp0backend"

echo ======================================================
echo   دەستپێکردنی سێرڤەری باکئەند (Backend - FastAPI)
echo ======================================================

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [هەڵە] پایتۆن (Python) نەدۆزرایەوە!
    pause
    exit /b 1
)

if not exist "venv" (
    echo [1/3] دروستکردنی ژینگەی جیاکراوە (venv)...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [هەڵە] نەتتوانی venv دروست بکەیت.
        pause
        exit /b 1
    )
)

echo [2/3] چالاککردنی venv و پشکنینی پاکێجەکان...
call venv\Scripts\activate.bat

pip show fastapi >nul 2>nul
if %errorlevel% neq 0 (
    echo [تێبینی] پاکێجەکان دادەمەزرێن... ئەمە کەمێک کاتی دەوێت...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [هەڵە] کێشەیەک ڕوویدا لە دابەزاندنی پاکێجەکان.
        pause
        exit /b 1
    )
)

echo [3/3] کارپێکردنی سێرڤەری باکئەند...
echo بەڵگەنامەی API لەسەر: http://127.0.0.1:8000/api/docs
echo ======================================================
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
