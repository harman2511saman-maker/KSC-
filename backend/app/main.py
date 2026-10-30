"""
Main FastAPI Application Entrypoint.
Production-ready Kurdish Sorani OMR Examination Platform Backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import DATA_DIR, UPLOADS_ORIGINAL_DIR, UPLOADS_NORMALIZED_DIR, UPLOADS_DEBUG_DIR, UPLOADS_SHEETS_DIR, UPLOADS_PROMO_DIR, UPLOADS_ONLINE_EXAMS_DIR, EXPORTS_DIR
from app.database import engine, Base, SessionLocal
from app.crud import init_seed_data
from app.routers import (
    auth_router,
    classes_router,
    students_router,
    exams_router,
    answer_keys_router,
    sheets_router,
    scan_router,
    reviews_router,
    results_router,
    calibration_router,
    export_router,
    competitions_router,
    online_exam_router
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Auto-migration check for newly added columns in existing SQLite databases
from sqlalchemy import text
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE classes ADD COLUMN region VARCHAR(64)"))
        conn.commit()
except Exception:
    pass

# Auto-assign initial region for existing classes if unassigned
try:
    with engine.connect() as conn:
        conn.execute(text("""
            UPDATE classes SET region = CASE
                WHEN LOWER(name) LIKE '%سلێمانی%' OR LOWER(name) LIKE '%slemani%' THEN 'sulaymaniyah'
                WHEN LOWER(name) LIKE '%دهۆک%' OR LOWER(name) LIKE '%duhok%' THEN 'duhok'
                WHEN LOWER(name) LIKE '%زاخۆ%' OR LOWER(name) LIKE '%zakho%' THEN 'zakho'
                WHEN LOWER(name) LIKE '%هەڵەبجە%' OR LOWER(name) LIKE '%halabja%' THEN 'halabja'
                WHEN LOWER(name) LIKE '%گەرمیان%' OR LOWER(name) LIKE '%کەلار%' OR LOWER(name) LIKE '%کفری%' THEN 'garmian'
                WHEN LOWER(name) LIKE '%ڕاپەڕین%' OR LOWER(name) LIKE '%ڕانیە%' OR LOWER(name) LIKE '%قەڵادزێ%' THEN 'raparin'
                WHEN LOWER(name) LIKE '%سۆران%' OR LOWER(name) LIKE '%ڕەواندز%' OR LOWER(name) LIKE '%چۆمان%' THEN 'soran'
                ELSE 'erbil'
            END
            WHERE region IS NULL OR region = ''
        """))
        conn.commit()
except Exception:
    pass
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE online_exams ADD COLUMN entry_cutoff_minutes INTEGER DEFAULT 3"))
        conn.commit()
except Exception:
    pass
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE online_exams ADD COLUMN is_coming_soon BOOLEAN DEFAULT 0"))
        conn.commit()
except Exception:
    pass
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE online_exams ADD COLUMN allow_screen_selection BOOLEAN DEFAULT 0"))
        conn.commit()
except Exception:
    pass
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE online_exams ADD COLUMN exam_mode TEXT DEFAULT 'ONLINE'"))
        conn.commit()
except Exception:
    pass
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE online_exams ADD COLUMN linked_exam_id INTEGER"))
        conn.commit()
except Exception:
    pass
for col in ["option_a", "option_b", "option_c", "option_d", "correct_answer"]:
    try:
        with engine.connect() as conn:
            conn.execute(text(f"ALTER TABLE online_exam_questions ADD COLUMN {col} TEXT"))
            conn.commit()
    except Exception:
        pass
for col_def in [("score", "REAL"), ("percentage", "REAL"), ("submitted_at", "DATETIME"), ("answers_json", "TEXT")]:
    try:
        with engine.connect() as conn:
            conn.execute(text(f"ALTER TABLE online_exam_passcodes ADD COLUMN {col_def[0]} {col_def[1]}"))
            conn.commit()
    except Exception:
        pass

# Ensure complete isolation of Online Exams from Paper OMR tables (Schools, Exams, Students, Results)
try:
    with engine.connect() as conn:
        conn.execute(text("""
            DELETE FROM detected_answers WHERE page_id IN (
                SELECT id FROM scan_pages WHERE job_id LIKE 'ONLINE_JOB_%'
            )
        """))
        conn.execute(text("""
            DELETE FROM results WHERE 
            exam_id IN (SELECT id FROM exams WHERE template_version = 'ONLINE' OR grade = 'ئۆنلاین')
            OR student_id IN (SELECT id FROM students WHERE grade = 'ئۆنلاین' OR class_id IN (SELECT id FROM classes WHERE grade = 'ئۆنلاین' OR name LIKE 'ئۆنلاین:%'))
            OR page_id IN (SELECT id FROM scan_pages WHERE job_id LIKE 'ONLINE_JOB_%')
        """))
        conn.execute(text("DELETE FROM scan_pages WHERE job_id LIKE 'ONLINE_JOB_%'"))
        conn.execute(text("DELETE FROM scan_jobs WHERE id LIKE 'ONLINE_JOB_%'"))
        conn.execute(text("""
            DELETE FROM students WHERE grade = 'ئۆنلاین' OR class_id IN (SELECT id FROM classes WHERE grade = 'ئۆنلاین' OR name LIKE 'ئۆنلاین:%')
        """))
        conn.execute(text("DELETE FROM exams WHERE template_version = 'ONLINE' OR grade = 'ئۆنلاین'"))
        conn.execute(text("""
            DELETE FROM classes WHERE grade = 'ئۆنلاین' OR name LIKE 'ئۆنلاین:%' OR name LIKE '%پلاتفۆرمی پێشبڕکێی ئۆنلاینی%'
        """))
        conn.commit()
except Exception:
    pass

# Seed realistic demo data
db_session = SessionLocal()
try:
    init_seed_data(db_session)
finally:
    db_session.close()

import os

# Base Paths
ENVIRONMENT = os.getenv("ENVIRONMENT", "production").lower()
is_production = (ENVIRONMENT == "production")

app = FastAPI(
    title="سیستەمی OMR بۆ تاقیکردنەوەکان (Kurdish Sorani OMR Platform)",
    version="1.0.0",
    docs_url=None if is_production else "/api/docs",
    redoc_url=None if is_production else "/api/redoc",
    openapi_url=None if is_production else "/openapi.json"
)

# CORS Security: Restrict to authorized production domains and local development
allowed_origins_env = os.getenv("CORS_ORIGINS")
if allowed_origins_env:
    origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
else:
    origins = [
        "https://ksciq.com",
        "https://www.ksciq.com",
        "http://ksciq.com",
        "http://www.ksciq.com",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Mount Static Uploads
app.mount("/uploads/original", StaticFiles(directory=str(UPLOADS_ORIGINAL_DIR)), name="original_uploads")
app.mount("/uploads/normalized", StaticFiles(directory=str(UPLOADS_NORMALIZED_DIR)), name="normalized_uploads")
app.mount("/uploads/debug", StaticFiles(directory=str(UPLOADS_DEBUG_DIR)), name="debug_uploads")
app.mount("/uploads/sheets", StaticFiles(directory=str(UPLOADS_SHEETS_DIR)), name="sheets_uploads")
app.mount("/uploads/promo", StaticFiles(directory=str(UPLOADS_PROMO_DIR)), name="promo_uploads")
app.mount("/uploads/online_exams", StaticFiles(directory=str(UPLOADS_ONLINE_EXAMS_DIR)), name="online_exams_uploads")

# Include Routers
app.include_router(auth_router.router)
app.include_router(classes_router.router)
app.include_router(students_router.router)
app.include_router(exams_router.router)
app.include_router(answer_keys_router.router)
app.include_router(sheets_router.router)
app.include_router(scan_router.router)
app.include_router(reviews_router.router)
app.include_router(results_router.router)
app.include_router(calibration_router.router)
app.include_router(export_router.router)
app.include_router(competitions_router.router)
app.include_router(online_exam_router.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Kurdish Students Competition (KSC) OMR Backend Engine",
        "version": "1.0.0",
        "docs": "/api/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "system": "Kurdish Sorani OMR Platform",
        "version": "1.0.0",
        "language": "ckb",
        "direction": "rtl"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
