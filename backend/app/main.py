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

app = FastAPI(
    title="سیستەمی OMR بۆ تاقیکردنەوەکان (Kurdish Sorani OMR Platform)",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
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
