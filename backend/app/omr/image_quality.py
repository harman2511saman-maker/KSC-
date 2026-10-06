"""
Image Quality Assessment Engine.
Checks for blur (Laplacian variance), under/over exposure, glare, and resolution adequacy.
Provides Kurdish user feedback for mobile scanning and upload validation.
"""

import cv2
import numpy as np
from typing import Dict, Any, Tuple

def evaluate_image_quality(
    image: np.ndarray,
    min_laplacian: float = 30.0,
    min_brightness: float = 25.0,
    max_brightness: float = 250.0
) -> Dict[str, Any]:
    """
    Evaluates raw camera or uploaded image quality.
    Returns boolean is_acceptable, quality metrics, and localized Kurdish messages.
    """
    if image is None or image.size == 0:
        return {
            "is_acceptable": False,
            "status_code": "EMPTY_IMAGE",
            "message_ku": "هیچ وێنەیەک نەدۆزرایەوە",
            "metrics": {}
        }

    h, w = image.shape[:2]
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    # 1. Resolution Check (Orientation-agnostic for portrait and landscape streams)
    min_dim = min(w, h)
    max_dim = max(w, h)
    if min_dim < 450 or max_dim < 600:
        return {
            "is_acceptable": False,
            "status_code": "LOW_RESOLUTION",
            "message_ku": "قەبارەی وێنەکە زۆر بچووکە، تکایە لە نزیکترەوە وێنە بگرە",
            "metrics": {"width": w, "height": h}
        }

    # 2. Blur / Sharpness Check (Laplacian Variance)
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    is_blurry = laplacian_var < min_laplacian

    # 3. Brightness & Exposure Check
    mean_brightness = float(np.mean(gray))
    is_too_dark = mean_brightness < min_brightness
    
    # 4. Glare / Specular Highlight Check
    # Percentage of pixels with intensity > 250
    glare_ratio = float(np.sum(gray > 250) / gray.size)
    is_high_glare = glare_ratio > 0.15 or mean_brightness > max_brightness

    # Determine overall status and Kurdish message
    issues = []
    if is_blurry:
        issues.append("وێنەکە ناڕوونە (تەڵخە)")
    if is_too_dark:
        issues.append("ڕووناکی کەمە")
    if is_high_glare:
        issues.append("تیشکی زۆر لەسەر پەڕەکە هەیە")

    is_acceptable = len(issues) == 0

    if is_acceptable:
        message_ku = "کوالیتی وێنە تەواوە و گونجاوە بۆ خوێندنەوە"
        status_code = "QUALITY_OK"
    else:
        message_ku = " ، ".join(issues)
        status_code = "QUALITY_WARNING"

    return {
        "is_acceptable": is_acceptable,
        "status_code": status_code,
        "message_ku": message_ku,
        "metrics": {
            "width": w,
            "height": h,
            "laplacian_variance": round(laplacian_var, 2),
            "mean_brightness": round(mean_brightness, 2),
            "glare_ratio": round(glare_ratio, 4),
            "is_blurry": is_blurry,
            "is_too_dark": is_too_dark,
            "is_high_glare": is_high_glare
        }
    }
