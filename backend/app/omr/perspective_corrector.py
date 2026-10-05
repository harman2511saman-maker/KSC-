"""
Perspective Correction and Canonical Page Normalization Engine.
Warps camera-captured or scanned answer sheets into canonical A4 (1200 x 1700 px) coordinates
using projective homography derived from the 4 corner registration markers.
"""

import cv2
import numpy as np
from typing import Dict, Any, Tuple, Optional
from app.omr.template_definitions import (
    CANONICAL_WIDTH,
    CANONICAL_HEIGHT,
    MARKER_CENTERS
)

def warp_to_canonical(
    image: np.ndarray,
    detected_corners: np.ndarray,
    target_width: int = CANONICAL_WIDTH,
    target_height: int = CANONICAL_HEIGHT,
    is_page_contour: bool = False
) -> Dict[str, Any]:
    """
    Computes projective homography and transforms the input image into the canonical coordinate system.
    
    detected_corners: 4x2 array ordered as [TL, TR, BR, BL]
    """
    if image is None or detected_corners is None or len(detected_corners) != 4:
        raise ValueError("Invalid image or corners for perspective transformation")

    src_pts = np.array(detected_corners, dtype=np.float32)

    # Destination points are either exact canonical marker centers or exact page corners
    if is_page_contour:
        dst_pts = np.array([
            [0, 0],
            [target_width, 0],
            [target_width, target_height],
            [0, target_height]
        ], dtype=np.float32)
    else:
        dst_pts = np.array([
            MARKER_CENTERS["TL"],  # (84, 84)
            MARKER_CENTERS["TR"],  # (1116, 84)
            MARKER_CENTERS["BR"],  # (1116, 1616)
            MARKER_CENTERS["BL"],  # (84, 1616)
        ], dtype=np.float32)

    # Calculate 3x3 Projective Homography Matrix
    homography_matrix = cv2.getPerspectiveTransform(src_pts, dst_pts)

    # Perform high quality perspective warp
    warped_color = cv2.warpPerspective(
        image,
        homography_matrix,
        (target_width, target_height),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE
    )

    if len(warped_color.shape) == 3:
        warped_gray = cv2.cvtColor(warped_color, cv2.COLOR_BGR2GRAY)
    else:
        warped_gray = warped_color.copy()
        warped_color = cv2.cvtColor(warped_gray, cv2.COLOR_GRAY2BGR)

    # Calculate perspective distortion severity / angle
    # Measure deviations from rectangle
    dx_top = src_pts[1][0] - src_pts[0][0]
    dy_top = src_pts[1][1] - src_pts[0][1]
    skew_angle_deg = float(np.degrees(np.arctan2(dy_top, dx_top)))

    return {
        "warped_color": warped_color,
        "warped_gray": warped_gray,
        "homography_matrix": homography_matrix.tolist(),
        "skew_angle_deg": round(skew_angle_deg, 2),
        "target_width": target_width,
        "target_height": target_height
    }
