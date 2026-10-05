"""
OMR Calibration and Computer Vision Diagnostics Router.
Provides configuration of recognition thresholds, quality tolerances,
and live visual testing of sample answer sheets with debug overlays.
"""

import json
import cv2
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.database import get_db
from app.models import OMRCalibration, User
from app.schemas import CalibrationSettings
from app.auth import get_current_user, require_role
from app.config import DEFAULT_CALIBRATION
from app.omr.omr_pipeline import process_omr_sheet
from app.crud import log_audit

router = APIRouter(prefix="/api/calibration", tags=["OMR Calibration"], dependencies=[Depends(get_current_user)])

@router.get("/")
def get_calibration_parameters(db: Session = Depends(get_db)):
    """Retrieves current OMR calibration parameters."""
    calib = db.query(OMRCalibration).filter(OMRCalibration.key == "default").first()
    if not calib:
        return DEFAULT_CALIBRATION
    try:
        return json.loads(calib.value_json)
    except Exception:
        return DEFAULT_CALIBRATION

@router.put("/")
def update_calibration_parameters(
    settings: CalibrationSettings,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates OMR recognition and quality thresholds."""
    calib = db.query(OMRCalibration).filter(OMRCalibration.key == "default").first()
    data_dict = settings.dict()
    if not calib:
        calib = OMRCalibration(key="default", value_json=json.dumps(data_dict))
        db.add(calib)
    else:
        calib.value_json = json.dumps(data_dict)

    db.commit()
    log_audit(db, "CALIBRATION_UPDATED", "OMRCalibration", "default", current_user, data_dict)
    return {
        "message": "ڕێکخستنەکانی OMR بە سەرکەوتوویی نوێکرانەوە",
        "settings": data_dict
    }

@router.post("/test-sheet")
async def test_calibration_sheet(
    file: UploadFile = File(...),
    total_questions: int = Form(50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Diagnostic endpoint for testing and calibrating OMR parameters.
    Returns detected marker coordinates, bubble fill measurements, and visual debug overlay.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="وێنەی بەتاڵ بارکراوە")

    calib_obj = db.query(OMRCalibration).filter(OMRCalibration.key == "default").first()
    calibration_params = json.loads(calib_obj.value_json) if calib_obj else DEFAULT_CALIBRATION.copy()

    exam_mock = {
        "number_of_questions": total_questions,
        "choices": ["A", "B", "C", "D"],
        "template_version": "OMR-V1"
    }

    result = process_omr_sheet(
        image_input=contents,
        exam_data=exam_mock,
        calibration_params=calibration_params,
        save_artifacts=True
    )

    return {
        "success": result["success"],
        "status_code": result["status_code"],
        "message_ku": result["message_ku"],
        "quality": result.get("quality"),
        "skew_angle_deg": result.get("skew_angle_deg"),
        "debug_image_path": result.get("debug_image_path"),
        "normalized_image_path": result.get("normalized_image_path"),
        "summary": result.get("summary"),
        "answers": result.get("answers", [])
    }
