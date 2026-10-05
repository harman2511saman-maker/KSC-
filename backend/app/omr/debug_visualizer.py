"""
Visual Debug and Calibration Overlay Generator.
Annotates normalized answer sheets with detected marker bounding boxes,
bubble ROIs, classification status colors, and confidence indicators.
Generates cropped review row snippets for teacher validation.
"""

import cv2
import numpy as np
from typing import Dict, Any, List, Optional
from PIL import Image

def generate_debug_overlay(
    canonical_color: np.ndarray,
    template_spec: Dict[str, Any],
    classification_result: Dict[str, Any],
    answer_key_dict: Optional[Dict[int, str]] = None
) -> np.ndarray:
    """
    Renders an annotated debug overlay image on top of the canonical sheet.
    
    Colors:
    - Markers: Cyan [255, 255, 0]
    - Selected / Correct: Green [0, 200, 0]
    - Incorrect: Red [0, 0, 220]
    - Multiple / Uncertain: Orange [0, 140, 255]
    - Blank: Gray [160, 160, 160]
    """
    overlay = canonical_color.copy()
    if len(overlay.shape) == 2:
        overlay = cv2.cvtColor(overlay, cv2.COLOR_GRAY2BGR)

    # 1. Draw 4 Registration Marker Boxes
    for marker_name, (bx, by, bw, bh) in template_spec["marker_boxes"].items():
        cv2.rectangle(overlay, (bx, by), (bx + bw, by + bh), (255, 255, 0), 2)
        cv2.putText(overlay, marker_name, (bx, by - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)

    # 2. Draw Question Bubble ROIs and Statuses
    questions_map = {q["question_num"]: q for q in classification_result.get("questions", [])}

    for q_num, q_info in template_spec["questions"].items():
        q_res = questions_map.get(q_num)
        if not q_res:
            continue

        status = q_res.get("status", "BLANK")
        detected_ans = q_res.get("detected_answer")
        correct_ans = answer_key_dict.get(q_num) if answer_key_dict else None

        for choice_key, b_info in q_info["bubbles"].items():
            bcx, bcy = b_info["cx"], b_info["cy"]
            r = b_info["radius"]
            inner_r = b_info["inner_radius"]
            feat = q_res.get("choices_metrics", {}).get(choice_key, {})
            fill_pct = int(feat.get("fill_ratio", 0) * 100)

            if choice_key == detected_ans:
                if status == "SELECTED":
                    if correct_ans is not None:
                        color = (0, 200, 0) if detected_ans == correct_ans else (0, 0, 220)
                    else:
                        color = (0, 200, 0)
                    cv2.circle(overlay, (bcx, bcy), r + 2, color, 2)
                    cv2.circle(overlay, (bcx, bcy), inner_r, color, -1)
                elif status == "UNCERTAIN":
                    cv2.circle(overlay, (bcx, bcy), r + 2, (0, 140, 255), 2)
            elif status == "MULTIPLE":
                # Check if this choice is one of the marked choices
                is_marked = (
                    feat.get("rel_contrast", 0) >= 14.0 or
                    feat.get("fill_ratio", 0) >= 0.18 or
                    feat.get("combined_score", 0) >= 0.20
                )
                if is_marked:
                    # Mark in bright RED to show student chose multiple answers and it is counted as WRONG
                    cv2.circle(overlay, (bcx, bcy), r + 2, (0, 0, 220), 2)
                    cv2.circle(overlay, (bcx, bcy), inner_r, (0, 0, 220), -1)
                else:
                    cv2.circle(overlay, (bcx, bcy), r, (180, 180, 180), 1)
            else:
                # Normal or blank
                cv2.circle(overlay, (bcx, bcy), r, (180, 180, 180), 1)

            # Tiny percentage label below bubble for calibration inspect
            if fill_pct > 15:
                cv2.putText(overlay, f"{fill_pct}%", (bcx - 12, bcy + r + 11), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (100, 100, 100), 1)

    return overlay

def extract_row_crop_image(
    canonical_img: np.ndarray,
    crop_box: Dict[str, int]
) -> np.ndarray:
    """Extracts a high-res image strip of the exact answer row for manual review."""
    x = crop_box["x"]
    y = crop_box["y"]
    w = crop_box["w"]
    h = crop_box["h"]
    return canonical_img[y:y+h, x:x+w]
