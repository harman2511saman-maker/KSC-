@echo off
title Push KSC to GitHub
chcp 65001 >nul
set "PATH=C:\Users\Harma\AppData\Local\Programs\Git\cmd;%PATH%"
cd /d "%~dp0"

echo ======================================================
echo   ناردنی نوێکارییەکان بۆ سەر GitHub
echo ======================================================
echo.

echo 1. کۆکردنەوەی فایلەکان...
git add .

echo 2. پاشەکەوتکردنی گۆڕانکارییەکان...
git commit -m "Update project: latest changes and improvements"

echo.
echo 3. ناردن بۆ سەر GitHub...
echo.

git push -u origin main

if errorlevel 1 goto ON_ERROR
goto ON_SUCCESS

:ON_ERROR
echo.
echo ======================================================
echo هەڵە ڕوویدا لە کاتی ناردن.
echo تکایە ئەگەر پەنجەرەی Browser کرایەوە کلیکی لێ بکە بۆ Sign in.
echo ======================================================
goto FINISH

:ON_SUCCESS
echo.
echo ======================================================
echo   پیرۆزە! هەموو نوێکارییەکان گەیشتنە سەر GitHub!
echo   ئێستا سێرڤەرەکەت خۆکارانە دەست دەکات بە Deploy بوون.
echo ======================================================
goto FINISH

:FINISH
echo.
pause


