"""
QR Identification Engine for Standardized OMR Examination Sheets.
Decodes structured JSON payloads from the canonical QR code region.
Extracts templateVersion, examId, studentId, sheetId with graceful fallback handling.
"""

import cv2
import json
import numpy as np
from typing import Dict, Any, Optional

from app.omr.template_definitions import QR_REGION

def decode_qr_code(
    canonical_gray: np.ndarray,
    full_image_fallback: Optional[np.ndarray] = None
) -> Dict[str, Any]:
    """
    Decodes the QR code from the canonical normalized image.
    First checks the designated QR ROI (`x=940, y=140, w=160, h=160` ± padding),
    then falls back to full image if needed.
    """
    if canonical_gray is None:
        return {
            "found": False,
            "status_code": "EMPTY_IMAGE",
            "message_ku": "هیچ وێنەیەک بۆ خوێندنەوەی کۆدی QR نەدۆزرایەوە",
            "data": None
        }

    qr_detector = cv2.QRCodeDetector()

    # 1. Inspect the deterministic QR ROI from the normalized sheet
    qx = max(0, QR_REGION["x"] - 30)
    qy = max(0, QR_REGION["y"] - 30)
    qw = min(canonical_gray.shape[1] - qx, QR_REGION["w"] + 60)
    qh = min(canonical_gray.shape[0] - qy, QR_REGION["h"] + 60)

    qr_roi = canonical_gray[qy:qy + qh, qx:qx + qw]

    # Preprocess QR ROI (multiple contrast enhancements)
    roi_variations = [
        qr_roi,
        cv2.equalizeHist(qr_roi),
        cv2.threshold(qr_roi, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],
    ]

    decoded_text = ""
    orientation_deg = 0
    for var_img in roi_variations:
        data, points, _ = qr_detector.detectAndDecode(var_img)
        if data:
            decoded_text = data
            orientation_deg = 0
            break

    # 2. Fallback: Search full canonical image
    if not decoded_text:
        data, points, _ = qr_detector.detectAndDecode(canonical_gray)
        if data:
            decoded_text = data
            if points is not None and len(points) > 0:
                mean_y = float(np.mean(points[..., 1]))
                if mean_y > (canonical_gray.shape[0] / 2.0):
                    orientation_deg = 180
                else:
                    orientation_deg = 0

    # 3. Fallback: Search raw input image if provided
    if not decoded_text and full_image_fallback is not None:
        if len(full_image_fallback.shape) == 3:
            raw_gray = cv2.cvtColor(full_image_fallback, cv2.COLOR_BGR2GRAY)
        else:
            raw_gray = full_image_fallback
        data, points, _ = qr_detector.detectAndDecode(raw_gray)
        if data:
            decoded_text = data

    # Parse payload
    if decoded_text:
        try:
            parsed = json.loads(decoded_text)
            return {
                "found": True,
                "status_code": "QR_DECODED",
                "message_ku": "کۆدی QR بە سەرکەوتوویی خوێندرایەوە",
                "raw_text": decoded_text,
                "orientation_deg": orientation_deg,
                "template_version": parsed.get("v", "OMR-V1"),
                "exam_id": parsed.get("e"),
                "student_id": parsed.get("s"),
                "sheet_id": parsed.get("sid"),
                "data": parsed
            }
        except json.JSONDecodeError:
            # Plain string format fallback e.g. "OMR-V1:EXAM-1:STUDENT-5"
            parts = decoded_text.split(":")
            return {
                "found": True,
                "status_code": "QR_DECODED_RAW",
                "message_ku": "کۆدی QR بە سەرکەوتوویی خوێندرایەوە",
                "raw_text": decoded_text,
                "orientation_deg": orientation_deg,
                "template_version": parts[0] if len(parts) > 0 else "OMR-V1",
                "exam_id": int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else None,
                "student_id": int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else None,
                "sheet_id": parts[3] if len(parts) > 3 else decoded_text,
                "data": {"raw": decoded_text}
            }

    return {
        "found": False,
        "status_code": "QR_NOT_FOUND",
        "message_ku": "کۆدی QR نەخوێندرایەوە (دەتوانیت بە دەستی قوتابی و تاقیکردنەوە دیاری بکەیت)",
        "raw_text": None,
        "template_version": "OMR-V1",
        "exam_id": None,
        "student_id": None,
        "sheet_id": None,
        "data": None
    }
