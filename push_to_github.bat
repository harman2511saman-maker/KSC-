@echo off
title Push KSC to GitHub
chcp 65001 >nul
set "PATH=C:\Users\Harma\AppData\Local\Programs\Git\cmd;%PATH%"
cd /d "%~dp0"

echo ======================================================
echo   ناردنی گۆڕانکارییەکان بۆ سەر GitHub
echo ======================================================
echo.

git status
echo.
echo دەستپێکردنی ناردن (Push) بۆ سەر لقی main...
echo.
git push -u origin main --force

if %errorlevel% neq 0 (
    echo.
    echo ======================================================
    echo [تێبینیی گرنگ بۆ داخڵبوون]:
    echo ئەگەر پەنجەرەی داخڵبوون کرایەوە:
    echo 1. دەتوانیت لە ڕێگەی وێبگەڕ (Browser) بچیتە ژوورەوە.
    echo 2. یان لە بەشی Password دەبێت GitHub Token دابنێیت نەک پاسۆردی ئاسایی.
    echo ======================================================
) else (
    echo.
    echo ======================================================
    echo   پیرۆزە! سەرکەوتووانە نێردرا بۆ سەر GitHub.
    echo   ئێستا سێرڤەری Render بە شێوەی خۆکار نوێ دەبێتەوە.
    echo ======================================================
)

echo.
pause
