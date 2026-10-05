@echo off
title Push KSC to GitHub
chcp 65001 >nul
set "PATH=C:\Users\Harma\AppData\Local\Programs\Git\cmd;%PATH%"
cd /d "%~dp0"

echo ======================================================
echo   ناردنی نوێکارییەکان بۆ سەر GitHub و سێرڤەر
echo ======================================================
echo.

echo 1. پشکنینی گۆڕانکارییەکان (Adding files)...
git add .

echo 2. پاشەکەوتکردنی گۆڕانکارییەکان (Commit)...
git commit -m "Update project: latest changes and improvements" 2>nul
if %errorlevel% equ 0 (
    echo گۆڕانکاری نوێ تۆمارکرا.
) else (
    echo هیچ گۆڕانکارییەکی نوێ نەبوو بۆ پاشەکەوتکردن، ڕاستەوخۆ دەنێردرێت...
)
echo.

echo 3. ناردن بۆ GitHub (Push to main)...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo ======================================================
    echo [تێبینیی گرنگ بۆ داخڵبوون بە ئەکاونت]:
    echo ئەگەر پەنجەرەی پێناسەکردن یان هەڵە دروست بوو:
    echo 1. پەنجەرەی وێبگەڕ (Sign in with browser) دەکرێتەوە، کرتەی لەسەر بکە بۆ ئەوەی ڕێگەپێدان بدەیت.
    echo 2. ئەگەر داوای Personal Access Token کرد، دەبێت تۆکنی گیتهەب دابنێیت.
    echo ======================================================
) else (
    echo.
    echo ======================================================
    echo   پیرۆزە! هەموو نوێکارییەکان گەیشتنە سەر GitHub!
    echo   ئێستا سێرڤەر (Render/Vercel) بە شێوەی ئۆتۆماتیکی
    echo   دەست دەکات بە Deploy کردن و نوێبوونەوە.
    echo ======================================================
)

echo.
pause

