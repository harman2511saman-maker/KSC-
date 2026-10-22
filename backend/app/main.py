"""
Main FastAPI Application Entrypoint.
Production-ready Kurdish Sorani OMR Examination Platform Backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import DATA_DIR, UPLOADS_ORIGINAL_DIR, UPLOADS_NORMALIZED_DIR, UPLOADS_DEBUG_DIR, UPLOADS_SHEETS_DIR, EXPORTS_DIR
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
    competitions_router
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

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
