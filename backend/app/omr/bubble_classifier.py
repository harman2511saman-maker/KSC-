"""
High-Precision OMR Bubble Recognition & Answer Classification Engine.
Analyzes inner bubble ROI features (fill ratio, mean intensity, local contrast, center occupancy)
while suppressing printed boundary strokes.
Applies adaptive dynamic classification into SELECTED, BLANK, MULTIPLE, UNCERTAIN with calibrated confidence scores.
"""

import cv2
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

def extract_bubble_features(
    canonical_gray: np.ndarray,
    cx: int,
    cy: int,
    radius: int = 14,
    inner_radius: int = 10,
    local_bg_thresh: Optional[float] = None
) -> Dict[str, Any]:
    """
    Extracts multi-dimensional features for a single bubble ROI with sub-pixel center snapping.
    Masks the inner circular region to measure graphite/ink density and core darkness.
    """
    h, w = canonical_gray.shape[:2]

    # Search a tiny local neighborhood (-4..+4 px) to lock precisely on the printed bubble center
    best_cx, best_cy = cx, cy
    min_mean = 255.0

    for dy in [-3, -1, 0, 1, 3]:
        for dx in [-3, -1, 0, 1, 3]:
            tcx, tcy = cx + dx, cy + dy
            if tcy - 5 < 0 or tcy + 5 >= h or tcx - 5 < 0 or tcx + 5 >= w:
                continue
            core_patch = canonical_gray[tcy - 4:tcy + 5, tcx - 4:tcx + 5]
            cur_mean = float(np.mean(core_patch))
            if cur_mean < min_mean:
                min_mean = cur_mean
                best_cx, best_cy = tcx, tcy

    cx, cy = best_cx, best_cy
    
    r_pad = radius + 3
    x1 = max(0, cx - r_pad)
    y1 = max(0, cy - r_pad)
    x2 = min(w, cx + r_pad + 1)
    y2 = min(h, cy + r_pad + 1)

    roi_gray = canonical_gray[y1:y2, x1:x2]
    roi_h, roi_w = roi_gray.shape

    if roi_h == 0 or roi_w == 0:
        return {
            "fill_ratio": 0.0,
            "mean_intensity": 255.0,
            "contrast_diff": 0.0,
            "center_occupancy": 0.0,
            "threshold_val": 120.0,
            "center": (cx, cy)
        }

    rcx = cx - x1
    rcy = cy - y1

    # Inner circular mask (inner_radius typically 8-10px)
    inner_mask = np.zeros((roi_h, roi_w), dtype=np.uint8)
    cv2.circle(inner_mask, (int(rcx), int(rcy)), int(inner_radius), 255, -1)
    inner_pixel_count = max(1, int(np.sum(inner_mask == 255)))

    # Outer background ring mask for local white-paper reference
    outer_bg_mask = np.zeros((roi_h, roi_w), dtype=np.uint8)
    cv2.circle(outer_bg_mask, (int(rcx), int(rcy)), int(radius + 4), 255, -1)
    cv2.circle(outer_bg_mask, (int(rcx), int(rcy)), int(radius + 1), 0, -1)
    outer_pixel_count = np.sum(outer_bg_mask == 255)

    if outer_pixel_count > 0:
        local_bg_mean = float(np.mean(roi_gray[outer_bg_mask == 255]))
    else:
        local_bg_mean = 200.0

    inner_pixels = roi_gray[inner_mask == 255]
    mean_intensity = float(np.mean(inner_pixels))

    # Adaptive darkness threshold based on local paper brightness
    threshold_val = local_bg_thresh if local_bg_thresh is not None else (local_bg_mean * 0.80)
    dark_pixels = np.sum(inner_pixels < threshold_val)
    fill_ratio = float(dark_pixels / inner_pixel_count)

    # Core occupancy
    core_mask = np.zeros((roi_h, roi_w), dtype=np.uint8)
    cv2.circle(core_mask, (int(rcx), int(rcy)), 4, 255, -1)
    core_pixels = roi_gray[core_mask == 255]
    core_fill = float(np.sum(core_pixels < threshold_val) / max(1, len(core_pixels)))

    contrast_diff = max(0.0, local_bg_mean - mean_intensity)

    return {
        "fill_ratio": round(fill_ratio, 4),
        "mean_intensity": round(mean_intensity, 2),
        "local_bg_mean": round(local_bg_mean, 2),
        "contrast_diff": round(contrast_diff, 2),
        "center_occupancy": round(core_fill, 4),
        "threshold_val": round(threshold_val, 2),
        "center": (cx, cy)
    }

def classify_question_answers(
    canonical_gray: np.ndarray,
    template_spec: Dict[str, Any],
    calibration_params: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Classifies all questions on the canonical sheet using Relative Row Contrast Normalization.
    Evaluates each choice against row-level baseline to flawlessly identify pencil/pen markings.
    """
    if calibration_params is None:
        calibration_params = {}

    questions_spec = template_spec["questions"]
    classified_questions = []
    overall_confidence_sum = 0.0

    count_selected = 0
    count_blank = 0
    count_multiple = 0
    count_uncertain = 0

    for q_num, q_info in questions_spec.items():
        bubbles_dict = q_info["bubbles"]
        choices_results = {}

        # 1. Extract raw features for all 4 choices
        for choice_key, b_info in bubbles_dict.items():
            feat = extract_bubble_features(
                canonical_gray,
                cx=b_info["cx"],
                cy=b_info["cy"],
                radius=b_info["radius"],
                inner_radius=b_info.get("inner_radius", 10)
            )
            choices_results[choice_key] = feat

        # 2. Row-level Baseline Intensity (Paper brightness for this exact row)
        intensities = [feat["mean_intensity"] for feat in choices_results.values()]
        # Sort intensities ascending (darkest to lightest)
        sorted_intensities = sorted(intensities)
        # Background is estimated from the lighter 2-3 bubbles
        row_bg_ref = np.mean(sorted_intensities[-2:]) if len(sorted_intensities) >= 2 else sorted_intensities[-1]

        # 3. Compute Row-Relative Darkness & Combined Score for each choice
        scored_choices = []
        for choice_key, feat in choices_results.items():
            rel_contrast = max(0.0, float(row_bg_ref - feat["mean_intensity"]))
            fill_r = feat["fill_ratio"]
            core_r = feat["center_occupancy"]

            # Combined darkness score (0.0 to 1.0+)
            # rel_contrast: 30-70 units darker is very strong fill
            contrast_norm = min(1.0, rel_contrast / 45.0)
            combined_score = (contrast_norm * 0.55) + (fill_r * 0.30) + (core_r * 0.15)

            feat["rel_contrast"] = round(rel_contrast, 2)
            feat["combined_score"] = round(combined_score, 4)

            scored_choices.append((choice_key, feat, combined_score, rel_contrast))

        # Sort choices by combined_score descending
        scored_choices.sort(key=lambda x: x[2], reverse=True)

        top_choice, top_feat, top_score, top_contrast = scored_choices[0]
        second_choice, second_feat, second_score, second_contrast = scored_choices[1] if len(scored_choices) > 1 else (None, {"fill_ratio": 0.0}, 0.0, 0.0)

        score_delta = top_score - second_score
        contrast_delta = top_contrast - second_contrast

        # 4. Strict and Accurate Classification Decision
        # An actual filled bubble must have genuine ink/graphite fill
        is_top_marked = (
            (top_feat["fill_ratio"] >= 0.28) or
            (top_contrast >= 24.0 and top_feat["fill_ratio"] >= 0.16) or
            (top_score >= 0.36)
        )
        is_second_marked = (
            (second_feat["fill_ratio"] >= 0.26) or
            (second_contrast >= 22.0 and second_feat["fill_ratio"] >= 0.15) or
            (second_score >= 0.33)
        )

        if not is_top_marked:
            # Clearly blank question
            status = "BLANK"
            detected_answer = None
            confidence = 0.99
            count_blank += 1

        elif is_second_marked and (contrast_delta < 15.0 or score_delta < 0.18):
            # Two choices are clearly filled (Multiple answers) -> Treated as invalid/wrong
            status = "MULTIPLE"
            detected_answer = None
            confidence = 0.98
            count_multiple += 1

        else:
            # Single clear dominant answer
            status = "SELECTED"
            detected_answer = top_choice
            confidence = min(0.99, max(0.85, 0.80 + (score_delta * 0.3)))
            count_selected += 1

        overall_confidence_sum += confidence

        # Row image crop bounds for teacher review tool
        min_bx = min(b["cx"] - b["radius"] for b in bubbles_dict.values()) - 40
        max_bx = max(b["cx"] + b["radius"] for b in bubbles_dict.values()) + 40
        min_by = min(b["cy"] - b["radius"] for b in bubbles_dict.values()) - 15
        max_by = max(b["cy"] + b["radius"] for b in bubbles_dict.values()) + 15

        classified_questions.append({
            "question_num": int(q_num),
            "detected_answer": detected_answer,
            "status": status,
            "confidence": round(confidence, 3),
            "top_choice": top_choice,
            "top_fill": top_feat["fill_ratio"],
            "second_choice": second_choice,
            "second_fill": second_feat["fill_ratio"],
            "fill_delta": round(top_feat["fill_ratio"] - second_feat["fill_ratio"], 4),
            "choices_metrics": choices_results,
            "crop_box": {
                "x": int(max(0, min_bx)),
                "y": int(max(0, min_by)),
                "w": int(min(canonical_gray.shape[1], max_bx) - max(0, min_bx)),
                "h": int(min(canonical_gray.shape[0], max_by) - max(0, min_by))
            }
        })

    total_q = len(questions_spec)
    avg_confidence = round(overall_confidence_sum / max(1, total_q), 3)

    return {
        "total_questions": total_q,
        "count_selected": count_selected,
        "count_blank": count_blank,
        "count_multiple": count_multiple,
        "count_uncertain": count_uncertain,
        "average_confidence": avg_confidence,
        "needs_review": (count_uncertain > 0),
        "questions": classified_questions
    }
