@echo off
title OMR Platform Launcher
chcp 65001 >nul

echo ======================================================
echo    دەستپێکردنی تەواوی سیستەمی OMR (Backend + Frontend)
echo ======================================================

echo [1/2] دەستپێکردنی سێرڤەری باکئەند (FastAPI)...
start "OMR Backend (FastAPI)" cmd /c "%~dp0start_backend.bat"

timeout /t 3 /nobreak >nul

echo [2/2] دەستپێکردنی ڕووکاری فرۆنتئەند (Vite React)...
start "OMR Frontend (React)" cmd /c "%~dp0start_frontend.bat"

echo ======================================================
echo هەردوو سێرڤەرەکە دەستیان پێکرد!
echo پەڕەی وێبگەڕ لە کەمێکی تردا دەکرێتەوە...
echo ناونیشان: http://localhost:3000
echo ======================================================
timeout /t 5 >nul
start http://localhost:3000
