"""
Database Reset & Clean Baseline Script for KSC OMR Examination Platform.
Clears all previous test scans, results, review queues, and temporary uploads,
and seeds clean baseline classes, students, and exams for KSC Educational Complex.
"""

import sys
import os
import shutil
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import engine, SessionLocal, Base
from app.models import (
    User, SchoolClass, Student, Exam, ExamQuestion,
    GeneratedSheet, ScanJob, ScanPage, DetectedAnswer, Result,
    ManualReview, AuditLog, OMRCalibration
)
from app.auth import get_password_hash
from app.config import (
    UPLOADS_ORIGINAL_DIR,
    UPLOADS_NORMALIZED_DIR,
    UPLOADS_DEBUG_DIR,
    UPLOADS_SHEETS_DIR,
    EXPORTS_DIR
)

def reset_and_clean_database():
    print("1. Cleaning temporary upload directories...")
    for upload_dir in [UPLOADS_ORIGINAL_DIR, UPLOADS_NORMALIZED_DIR, UPLOADS_DEBUG_DIR, UPLOADS_SHEETS_DIR, EXPORTS_DIR]:
        if upload_dir.exists():
            for item in upload_dir.iterdir():
                if item.is_file():
                    try:
                        item.unlink()
                    except Exception:
                        pass
                elif item.is_dir():
                    try:
                        shutil.rmtree(item)
                    except Exception:
                        pass

    print("2. Re-creating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    from app.config import ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_FULL_NAME_KU

    db = SessionLocal()
    try:
        print("3. Seeding clean admin users from environment configuration...")
        admin_user = User(
            username=ADMIN_USERNAME,
            password_hash=get_password_hash(ADMIN_PASSWORD),
            full_name_ku=ADMIN_FULL_NAME_KU,
            role="ADMIN",
            is_active=True
        )
        db.add(admin_user)
        db.commit()

        print("4. Seeding KSC Classes...")
        c1 = SchoolClass(name="پۆلی ١٢ی زانستی (A)", grade="پۆلی ١٢", academic_year="2025 - 2026")
        c2 = SchoolClass(name="پۆلی ١٢ی زانستی (B)", grade="پۆلی ١٢", academic_year="2025 - 2026")
        c3 = SchoolClass(name="پۆلی ٩ی بنەڕەتی (A)", grade="پۆلی ٩", academic_year="2025 - 2026")
        db.add_all([c1, c2, c3])
        db.commit()

        print("5. Seeding KSC Students with unique IDs...")
        students_data = [
            ("STD-101", "ئالان دانا ئەحمەد", "پۆلی ١٢", c1.id),
            ("STD-102", "شنیار ڕێبوار کەمال", "پۆلی ١٢", c1.id),
            ("STD-103", "پێشەوا عومەر حەسەن", "پۆلی ١٢", c1.id),
            ("STD-104", "لانە هێمن فەرهاد", "پۆلی ١٢", c1.id),
            ("STD-105", "دیار بەختیار محەمەد", "پۆلی ١٢", c1.id),
            ("STD-106", "سارا کاروان جەمال", "پۆلی ١٢", c2.id),
            ("STD-107", "ڕەوەند ئاراس کەریم", "پۆلی ١٢", c2.id),
            ("STD-201", "کاردۆ سالار قادر", "پۆلی ٩", c3.id),
            ("STD-202", "سۆزیار مەریوان عەلی", "پۆلی ٩", c3.id),
            ("STD-203", "هاوکار فەریق مەحمود", "پۆلی ٩", c3.id),
        ]
        for sid, name, grade, cid in students_data:
            db.add(Student(
                student_id=sid,
                name=name,
                grade=grade,
                class_id=cid,
                academic_year="2025 - 2026",
                qr_identifier=f"QR-{sid}"
            ))
        db.commit()

        print("6. Seeding KSC Examination templates...")
        exam1 = Exam(
            exam_name="تاقیکردنەوەی خولی یەکەمی زیندەزانی (KSC)",
            subject="زیندەزانی",
            grade="پۆلی ١٢",
            class_id=c1.id,
            academic_year="2025 - 2026",
            exam_date="2026-06-15",
            number_of_questions=50,
            choices="A,B,C,D",
            total_marks=100.0,
            pass_mark=50.0,
            instructions="تکایە پەڕەی وەڵام بە قەڵەمی ڕەساس (HB) بە شێوەیەکی تۆخ پڕبکەرەوە.",
            status="ACTIVE",
            template_version="OMR-V1"
        )
        db.add(exam1)
        db.commit()

        # Answer key for Exam 1 (50 questions)
        preset_answers_50 = [
            "A", "B", "C", "D", "A", "C", "B", "D", "A", "B",
            "C", "D", "A", "A", "B", "C", "D", "B", "C", "A",
            "D", "B", "C", "A", "D", "A", "C", "B", "D", "B",
            "C", "A", "D", "B", "C", "A", "B", "D", "C", "A",
            "B", "C", "D", "A", "B", "C", "D", "A", "B", "C"
        ]
        for q_idx, ans in enumerate(preset_answers_50, start=1):
            db.add(ExamQuestion(
                exam_id=exam1.id,
                question_num=q_idx,
                correct_answer=ans,
                marks=2.0,
                is_ungraded=False
            ))

        # Exam 2: 25 questions Mathematics
        exam2 = Exam(
            exam_name="تاقیکردنەوەی وەرزی یەکەمی بیرکاری (KSC)",
            subject="بیرکاری",
            grade="پۆلی ٩",
            class_id=c3.id,
            academic_year="2025 - 2026",
            exam_date="2026-05-10",
            number_of_questions=25,
            choices="A,B,C,D",
            total_marks=100.0,
            pass_mark=50.0,
            instructions="تەنها یەک بازنەی وەڵامی دروست بە تەواوی پڕبکەرەوە.",
            status="ACTIVE",
            template_version="OMR-V1"
        )
        db.add(exam2)
        db.commit()

        preset_answers_25 = [
            "B", "A", "C", "D", "A", "B", "D", "C", "A", "B",
            "C", "D", "B", "A", "C", "D", "A", "C", "B", "D",
            "A", "B", "C", "D", "A"
        ]
        for q_idx, ans in enumerate(preset_answers_25, start=1):
            db.add(ExamQuestion(
                exam_id=exam2.id,
                question_num=q_idx,
                correct_answer=ans,
                marks=4.0,
                is_ungraded=False
            ))

        db.commit()
        print("Done! Clean baseline successfully created.")
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_clean_database()
