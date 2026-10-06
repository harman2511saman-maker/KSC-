"""
Robust Registration Marker Detection Engine.
Locates the 4 corner registration markers on the captured/uploaded answer sheet.
Validates geometric plausibility, convexity, and aspect ratio.
"""

import cv2
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

def order_quadrilateral_points(pts: np.ndarray) -> np.ndarray:
    """
    Orders 4 points in canonical sequence:
    [Top-Left, Top-Right, Bottom-Right, Bottom-Left]
    Ensures portrait alignment where canonical height (longer edge) maps to Y axis.
    """
    pts = np.array(pts, dtype=np.float32).reshape(4, 2)
    rect = np.zeros((4, 2), dtype=np.float32)

    # Sum of (x + y): Top-Left has minimum sum, Bottom-Right has maximum sum
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # TL
    rect[2] = pts[np.argmax(s)]  # BR

    # Difference of (y - x): Top-Right has minimum diff, Bottom-Left has maximum diff
    diff = np.diff(pts, axis=1).reshape(4)
    rect[1] = pts[np.argmin(diff)]  # TR
    rect[3] = pts[np.argmax(diff)]  # BL

    # Check if the points form a landscape rectangle (width > height)
    w_top = np.linalg.norm(rect[1] - rect[0])
    w_bot = np.linalg.norm(rect[2] - rect[3])
    h_left = np.linalg.norm(rect[3] - rect[0])
    h_right = np.linalg.norm(rect[2] - rect[1])
    avg_w = (w_top + w_bot) / 2.0
    avg_h = (h_left + h_right) / 2.0

    if avg_w > avg_h:
        # Rotate 90 degrees counter-clockwise so that canonical height (longer edge) maps vertically
        rect = np.array([rect[1], rect[2], rect[3], rect[0]], dtype=np.float32)

    return rect

def validate_quadrilateral_geometry(corners: np.ndarray, img_w: int, img_h: int) -> Tuple[bool, str]:
    """
    Validates that the 4 corner points form a plausible convex quadrilateral.
    Forgiving bounds tailored for real-world smartphone camera tilts and PDF documents.
    """
    if len(corners) != 4:
        return False, "تەواوی ٤ نیشانەکە نەدۆزرایەوە"

    # 1. Convexity check
    pts_int = corners.reshape((-1, 1, 2)).astype(np.int32)
    if not cv2.isContourConvex(pts_int):
        return False, "شێوەی چوارگۆشەی پەڕەکە شێواوە یان چەماوەتەوە"

    # 2. Aspect Ratio & Dimensions
    tl, tr, br, bl = corners
    width_top = np.linalg.norm(tr - tl)
    width_bottom = np.linalg.norm(br - bl)
    height_left = np.linalg.norm(bl - tl)
    height_right = np.linalg.norm(br - tr)

    avg_width = (width_top + width_bottom) / 2.0
    avg_height = (height_left + height_right) / 2.0

    min_side = min(avg_width, avg_height)
    max_side = max(avg_width, avg_height)

    if min_side < 60 or max_side < 90:
        return False, "پەڕەکە زۆر دوورە، تکایە کامێراکە نزیکتر بکەوە"

    # Symmetry check with forgiving mobile tilt tolerance
    width_ratio = min(width_top, width_bottom) / max(width_top, width_bottom, 1.0)
    height_ratio = min(height_left, height_right) / max(height_left, height_right, 1.0)
    if width_ratio < 0.45 or height_ratio < 0.45:
        return False, "تەواوی پەڕەکە بە هاوسەنگی لە ناو وێنەکەدا نییە"

    norm_aspect = max_side / max(min_side, 1.0)
    # A4 standard aspect ratio is 1.414. Allow range [0.85, 2.25] for diverse phone orientations & angles
    if norm_aspect < 0.85 or norm_aspect > 2.25:
        return False, "تکایە هەموو پەڕەکە لە ناو چوارچێوەکە ڕێکبخە (بەشی سەرەوە و خوارەوە دیار نییە)"

    return True, "نیشانەکان بە دروستی دۆزرانەوە"

def detect_registration_markers(
    image: np.ndarray,
    expected_marker_size_ratio: float = 0.035
) -> Dict[str, Any]:
    """
    Detects the 4 corner registration markers using multi-strategy contour, quadrant, and corner zone analysis.
    Returns ordered corners: [TL, TR, BR, BL] and diagnostic metrics.
    """
    if image is None or image.size == 0:
        return {
            "success": False,
            "status_code": "EMPTY_IMAGE",
            "message_ku": "هیچ وێنەیەک نەدۆزرایەوە",
            "corners": None,
            "is_page_contour": False,
            "markers_count": 0,
            "raw_candidates_count": 0
        }

    h, w = image.shape[:2]
    img_area = float(w * h)

    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()

    # Apply slight Gaussian blur to suppress fine noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Strategy: Multi-threshold contour search (Multi-scale Adaptive + Otsu + Morphological)
    threshold_methods = [
        ("adaptive_15_5", cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 5)),
        ("adaptive_25_7", cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 7)),
        ("adaptive_35_10", cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 35, 10)),
        ("adaptive_55_10", cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 55, 10)),
        ("otsu", cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]),
    ]

    candidate_markers = []

    for name, thresh in threshold_methods:
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            # Filter area: true corner marker should be 0.003% to 4.0% of image area
            if area < img_area * 0.00003 or area > img_area * 0.04:
                continue

            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.05 * peri, True)

            # Square aspect ratio check (allow perspective distortion: 0.45 to 2.20)
            x, y, bw, bh = cv2.boundingRect(cnt)
            aspect = float(bw) / float(bh) if bh > 0 else 0
            if aspect < 0.45 or aspect > 2.20:
                continue

            # Solidity / fill check (solid square marker)
            hull = cv2.convexHull(cnt)
            hull_area = cv2.contourArea(hull)
            solidity = float(area) / hull_area if hull_area > 0 else 0
            if solidity < 0.58:
                continue

            # Check inside bounding box to reject light or empty contours
            roi_gray = gray[max(0, y):min(h, y + bh), max(0, x):min(w, x + bw)]
            if roi_gray.size > 0:
                mean_val = float(np.mean(roi_gray))
                if mean_val > 195:
                    continue

            # Calculate center of mass
            M = cv2.moments(cnt)
            if M["m00"] != 0:
                cx = float(M["m10"] / M["m00"])
                cy = float(M["m01"] / M["m00"])
            else:
                cx = float(x + bw / 2.0)
                cy = float(y + bh / 2.0)

            # Avoid duplicates
            is_dup = False
            for cand in candidate_markers:
                if np.hypot(cx - cand["cx"], cy - cand["cy"]) < (bw * 0.8):
                    is_dup = True
                    break
            
            if not is_dup:
                candidate_markers.append({
                    "cx": cx,
                    "cy": cy,
                    "w": bw,
                    "h": bh,
                    "area": area,
                    "solidity": solidity,
                    "approx_len": len(approx)
                })

    # If we found at least 4 candidate markers, cluster by 4 quadrants
    if len(candidate_markers) >= 4:
        center_x = w / 2.0
        center_y = h / 2.0

        quad_tl = [c for c in candidate_markers if c["cx"] < center_x and c["cy"] < center_y]
        quad_tr = [c for c in candidate_markers if c["cx"] >= center_x and c["cy"] < center_y]
        quad_bl = [c for c in candidate_markers if c["cx"] < center_x and c["cy"] >= center_y]
        quad_br = [c for c in candidate_markers if c["cx"] >= center_x and c["cy"] >= center_y]

        # Select the most extreme outer corner marker in each quadrant
        if quad_tl and quad_tr and quad_bl and quad_br:
            # TL: smallest distance to (0, 0)
            best_tl = min(quad_tl, key=lambda c: np.hypot(c["cx"] - 0, c["cy"] - 0))
            # TR: smallest distance to (w, 0)
            best_tr = min(quad_tr, key=lambda c: np.hypot(c["cx"] - w, c["cy"] - 0))
            # BR: smallest distance to (w, h)
            best_br = min(quad_br, key=lambda c: np.hypot(c["cx"] - w, c["cy"] - h))
            # BL: smallest distance to (0, h)
            best_bl = min(quad_bl, key=lambda c: np.hypot(c["cx"] - 0, c["cy"] - h))

            raw_pts = np.array([
                [best_tl["cx"], best_tl["cy"]],
                [best_tr["cx"], best_tr["cy"]],
                [best_br["cx"], best_br["cy"]],
                [best_bl["cx"], best_bl["cy"]]
            ], dtype=np.float32)

            ordered_corners = order_quadrilateral_points(raw_pts)
            is_valid, reason_ku = validate_quadrilateral_geometry(ordered_corners, w, h)

            if is_valid:
                return {
                    "success": True,
                    "status_code": "MARKERS_DETECTED",
                    "message_ku": reason_ku,
                    "corners": ordered_corners.tolist(),
                    "is_page_contour": False,
                    "markers_count": 4,
                    "raw_candidates_count": len(candidate_markers)
                }

    # Parallelogram 3-Corner Recovery Strategy:
    # If 3 distinct corner quadrants have strong markers, reconstruct the 4th corner geometrically
    if len(candidate_markers) >= 3:
        center_x = w / 2.0
        center_y = h / 2.0

        quad_tl = [c for c in candidate_markers if c["cx"] < center_x and c["cy"] < center_y]
        quad_tr = [c for c in candidate_markers if c["cx"] >= center_x and c["cy"] < center_y]
        quad_bl = [c for c in candidate_markers if c["cx"] < center_x and c["cy"] >= center_y]
        quad_br = [c for c in candidate_markers if c["cx"] >= center_x and c["cy"] >= center_y]

        found_quads = {
            "TL": min(quad_tl, key=lambda c: np.hypot(c["cx"] - 0, c["cy"] - 0)) if quad_tl else None,
            "TR": min(quad_tr, key=lambda c: np.hypot(c["cx"] - w, c["cy"] - 0)) if quad_tr else None,
            "BR": min(quad_br, key=lambda c: np.hypot(c["cx"] - w, c["cy"] - h)) if quad_br else None,
            "BL": min(quad_bl, key=lambda c: np.hypot(c["cx"] - 0, c["cy"] - h)) if quad_bl else None,
        }

        present_count = sum(1 for v in found_quads.values() if v is not None)
        if present_count == 3:
            pt_tl = np.array([found_quads["TL"]["cx"], found_quads["TL"]["cy"]], dtype=np.float32) if found_quads["TL"] else None
            pt_tr = np.array([found_quads["TR"]["cx"], found_quads["TR"]["cy"]], dtype=np.float32) if found_quads["TR"] else None
            pt_br = np.array([found_quads["BR"]["cx"], found_quads["BR"]["cy"]], dtype=np.float32) if found_quads["BR"] else None
            pt_bl = np.array([found_quads["BL"]["cx"], found_quads["BL"]["cy"]], dtype=np.float32) if found_quads["BL"] else None

            if pt_bl is None:
                pt_bl = pt_tl + (pt_br - pt_tr)
            elif pt_br is None:
                pt_br = pt_tr + (pt_bl - pt_tl)
            elif pt_tl is None:
                pt_tl = pt_tr + (pt_bl - pt_br)
            elif pt_tr is None:
                pt_tr = pt_tl + (pt_br - pt_bl)

            raw_pts = np.array([pt_tl, pt_tr, pt_br, pt_bl], dtype=np.float32)
            ordered_corners = order_quadrilateral_points(raw_pts)
            is_valid, reason_ku = validate_quadrilateral_geometry(ordered_corners, w, h)
            if is_valid:
                return {
                    "success": True,
                    "status_code": "MARKERS_RECOVERED_3PT",
                    "message_ku": "نیشانەکان بە شێوازی ئەندازەیی دۆزرانەوە (٣ نیشانەی سەرەکی + تەواوکردن)",
                    "corners": ordered_corners.tolist(),
                    "is_page_contour": False,
                    "markers_count": 3,
                    "raw_candidates_count": len(candidate_markers)
                }

    # Fallback Strategy: Page Contour Detection mapped to full page boundary
    edges = cv2.Canny(blurred, 30, 150)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    edges = cv2.dilate(edges, kernel, iterations=1)
    page_contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    page_contours = sorted(page_contours, key=cv2.contourArea, reverse=True)[:5]

    for c in page_contours:
        area = cv2.contourArea(c)
        if area < img_area * 0.25:  # Page must cover at least 25% of image
            continue
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.03 * peri, True)
        if len(approx) == 4:
            pts = approx.reshape(4, 2)
            ordered_corners = order_quadrilateral_points(pts)
            is_valid, reason_ku = validate_quadrilateral_geometry(ordered_corners, w, h)
            if is_valid:
                return {
                    "success": True,
                    "status_code": "PAGE_CONTOUR_DETECTED",
                    "message_ku": "چوارچێوەی پەڕەکە دۆزرایەوە بە سەرکەوتوویی",
                    "corners": ordered_corners.tolist(),
                    "is_page_contour": True,
                    "markers_count": 4,
                    "raw_candidates_count": len(candidate_markers)
                }

    # If all detection failed
    return {
        "success": False,
        "status_code": "MARKERS_NOT_FOUND",
        "message_ku": "نیشانەکانی چوار گۆشەی پەڕەکە (Registration Markers) نەدۆزرایەوە. تکایە دڵنیابە لە تەواوی پەڕەکە لە ناو وێنەکەدایە.",
        "corners": None,
        "is_page_contour": False,
        "markers_count": len(candidate_markers),
        "raw_candidates_count": len(candidate_markers)
    }
