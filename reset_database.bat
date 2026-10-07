@echo off
title Clear OMR Database Data
chcp 65001 >nul
cd /d "%~dp0backend"

echo ======================================================
echo   سڕینەوە و خاوێنکردنەوەی گشت داتاکانی سێرڤەر
echo ======================================================
echo.
echo ئایا دڵنیایت دەتەوێت هەموو داتاکانی قوتابیان، فۆڕمەکان و ئەنجامەکان بسڕیتەوە؟
echo (بۆ پەسەندکردن و سڕینەوە کلیک لە هەر دوگمەیەک بکە، یان پەنجەرەکە دابخە بۆ پاشگەزبوونەوە)
pause

.\venv\Scripts\python.exe -c "from app.database import SessionLocal; from app.models import SchoolClass, Student, Exam, ExamQuestion, Result, ScanJob, ScanPage, DetectedAnswer, GeneratedSheet, ManualReview, AuditLog; db = SessionLocal(); db.query(ManualReview).delete(); db.query(DetectedAnswer).delete(); db.query(Result).delete(); db.query(ScanPage).delete(); db.query(ScanJob).delete(); db.query(GeneratedSheet).delete(); db.query(ExamQuestion).delete(); db.query(Exam).delete(); db.query(Student).delete(); db.query(SchoolClass).delete(); db.commit(); print('گشت داتاکان بە سەرکەوتوویی سڕانەوە!'); db.close()"

echo.
echo ======================================================
echo سەرکەوتوو بوو! داتابەیس بە تەواوی خاوێنکرایەوە.
echo ======================================================
pause
