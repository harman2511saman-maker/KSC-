import os
from pathlib import Path
from dotenv import load_dotenv

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATA_DIR = BASE_DIR / "data"
UPLOADS_ORIGINAL_DIR = DATA_DIR / "uploads" / "original"
UPLOADS_NORMALIZED_DIR = DATA_DIR / "uploads" / "normalized"
UPLOADS_DEBUG_DIR = DATA_DIR / "uploads" / "debug"
UPLOADS_SHEETS_DIR = DATA_DIR / "uploads" / "sheets"
EXPORTS_DIR = DATA_DIR / "exports"

for directory in [
    DATA_DIR,
    UPLOADS_ORIGINAL_DIR,
    UPLOADS_NORMALIZED_DIR,
    UPLOADS_DEBUG_DIR,
    UPLOADS_SHEETS_DIR,
    EXPORTS_DIR,
]:
    directory.mkdir(parents=True, exist_ok=True)

# Database
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = f"sqlite:///{DATA_DIR / 'omr_system.db'}"
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

# Security Configuration (Loaded exclusively from Environment Variables)
SECRET_KEY = os.getenv("SECRET_KEY", "omr-kurdish-sorani-secure-jwt-key-2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))

# Default Admin Seed Config (Set your secure credentials in .env file)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@Secure2026!")
ADMIN_FULL_NAME_KU = os.getenv("ADMIN_FULL_NAME_KU", "بەڕێوەبەری سەرەکی پلاتفۆرم")

# Canonical A4 Geometry (Standardized OMR-V1 coordinate system)
# A4 standard aspect ratio: 210mm x 297mm ≈ 1 : 1.4142
# High precision canonical resolution: 1200 x 1700 pixels (≈ 145 DPI equivalent for fast & sharp processing)
CANONICAL_WIDTH = 1200
CANONICAL_HEIGHT = 1700

# Default Calibration Parameters
DEFAULT_CALIBRATION = {
    "min_fill_ratio": 0.35,          # Minimum dark pixel ratio inside inner circle to consider filled
    "multiple_margin": 0.12,         # If 2nd bubble fill is within this margin of 1st, mark as MULTIPLE
    "uncertain_lower_bound": 0.25,   # Ambiguous zone start (e.g. light pencil, partial fill)
    "uncertain_upper_bound": 0.45,   # Ambiguous zone end where confidence is lower
    "blank_threshold": 0.18,         # Under this value, bubble is unconditionally blank
    "inner_radius_ratio": 0.65,      # Radius multiplier to inspect only bubble interior and ignore outer boundary
    "blur_laplacian_threshold": 60.0,# Variance of Laplacian under which image is flagged as too blurry
    "min_brightness": 35.0,          # Minimum mean brightness (low light check)
    "max_brightness": 240.0,         # Maximum mean brightness (overexposed / glare check)
    "marker_size_tolerance": 0.35,   # Tolerance on registration marker dimensions
}
