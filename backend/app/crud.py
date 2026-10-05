"""
Database CRUD operations and Audit Logging.
Includes database initialization and seeding of realistic Kurdish Sorani examination data.
"""

import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models import (
    User, SchoolClass, Student, Exam, ExamQuestion,
    GeneratedSheet, ScanJob, ScanPage, DetectedAnswer,
    Result, ManualReview, AuditLog, OMRCalibration
)
from app.auth import get_password_hash
from app.config import DEFAULT_CALIBRATION, ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_FULL_NAME_KU

def log_audit(
    db: Session,
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    user: Optional[User] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    audit = AuditLog(
        user_id=user.id if user else None,
        username=user.username if user else "سیستەم",
        action=action,
        entity=entity,
        entity_id=str(entity_id) if entity_id is not None else None,
        metadata_json=json.dumps(metadata or {}, ensure_ascii=False)
    )
    db.add(audit)
    db.commit()

def init_seed_data(db: Session):
    """Initializes master admin user from environment variables and calibration defaults."""
    # 1. Master Admin User (Configured via Environment)
    admin = db.query(User).filter(User.username == ADMIN_USERNAME).first()
    if not admin:
        # Check if old admin exists and upgrade
        old_admin = db.query(User).filter(User.username == "admin").first()
        if old_admin:
            old_admin.username = ADMIN_USERNAME
            old_admin.password_hash = get_password_hash(ADMIN_PASSWORD)
            old_admin.full_name_ku = ADMIN_FULL_NAME_KU
            old_admin.role = "ADMIN"
        else:
            admin = User(
                username=ADMIN_USERNAME,
                password_hash=get_password_hash(ADMIN_PASSWORD),
                full_name_ku=ADMIN_FULL_NAME_KU,
                role="ADMIN"
            )
            db.add(admin)
        db.commit()

    # 2. Calibration defaults
    calib = db.query(OMRCalibration).filter(OMRCalibration.key == "default").first()
    if not calib:
        calib = OMRCalibration(
            key="default",
            value_json=json.dumps(DEFAULT_CALIBRATION)
        )
        db.add(calib)
        db.commit()

