"""
Complete End-to-End OMR Computer Vision Pipeline.
Orchestrates preprocessing, quality evaluation, marker detection, perspective transformation,
canonical normalization, QR identification, bubble recognition, answer-key grading, and debug overlays.
"""

import os
import cv2
import uuid
import base64
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional, List

from app.config import (
    UPLOADS_ORIGINAL_DIR,
    UPLOADS_NORMALIZED_DIR,
    UPLOADS_DEBUG_DIR,
    DEFAULT_CALIBRATION
)
from app.omr.template_definitions import (
    generate_template_spec,
    DEFAULT_OMR_V1_SPEC
)
from app.omr.image_quality import evaluate_image_quality
from app.omr.marker_detector import detect_registration_markers
from app.omr.perspective_corrector import warp_to_canonical
from app.omr.qr_processor import decode_qr_code
from app.omr.bubble_classifier import classify_question_answers
from app.omr.debug_visualizer import generate_debug_overlay, extract_row_crop_image

def process_omr_sheet(
    image_input: np.ndarray | bytes | str,
    exam_data: Optional[Dict[str, Any]] = None,
    answer_key_dict: Optional[Dict[int, str]] = None,
    question_marks_dict: Optional[Dict[int, float]] = None,
    ungraded_questions: Optional[List[int]] = None,
    calibration_params: Optional[Dict[str, Any]] = None,
    save_artifacts: bool = True
) -> Dict[str, Any]:
    """
    Executes the complete OMR processing pipeline on a single image.
    Returns structured domain data, scores, confidence metrics, and file paths.
    """
    if calibration_params is None:
        calibration_params = DEFAULT_CALIBRATION.copy()

    # 1. Load image to NumPy array
    if isinstance(image_input, str):
        img_bgr = cv2.imread(image_input)
    elif isinstance(image_input, bytes):
        nparr = np.frombuffer(image_input, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    elif isinstance(image_input, np.ndarray):
        img_bgr = image_input.copy()
    else:
        raise ValueError("Unsupported image input format")

    if img_bgr is None or img_bgr.size == 0:
        return {
            "success": False,
            "status_code": "EMPTY_IMAGE",
            "message_ku": "نەتوانرا وێنەکە بخوێندرێتەوە یان بەتاڵە",
            "answers": [],
            "score_summary": None
        }

    unique_id = str(uuid.uuid4())[:12]
    original_filename = f"scan_{unique_id}.jpg"
    normalized_filename = f"norm_{unique_id}.jpg"
    debug_filename = f"debug_{unique_id}.jpg"

    original_path = str(UPLOADS_ORIGINAL_DIR / original_filename)
    normalized_path = str(UPLOADS_NORMALIZED_DIR / normalized_filename)
    debug_path = str(UPLOADS_DEBUG_DIR / debug_filename)

    if save_artifacts:
        cv2.imwrite(original_path, img_bgr)

    # 2. Quality Check
    quality_result = evaluate_image_quality(
        img_bgr,
        min_laplacian=calibration_params.get("blur_laplacian_threshold", 30.0),
        min_brightness=calibration_params.get("min_brightness", 25.0),
        max_brightness=calibration_params.get("max_brightness", 250.0)
    )

    # 3. Detect 4 Registration Markers
    marker_result = detect_registration_markers(img_bgr)
    if not marker_result["success"]:
        return {
            "success": False,
            "status_code": marker_result["status_code"],
            "message_ku": marker_result["message_ku"],
            "quality": quality_result,
            "original_image_path": original_filename if save_artifacts else None,
            "normalized_image_path": None,
            "debug_image_path": None,
            "answers": [],
            "score_summary": None
        }

    detected_corners = np.array(marker_result["corners"], dtype=np.float32)

    # 4. Perspective Transformation & Canonical Normalization
    warp_result = warp_to_canonical(
        img_bgr,
        detected_corners,
        is_page_contour=marker_result.get("is_page_contour", False)
    )
    canonical_color = warp_result["warped_color"]
    canonical_gray = warp_result["warped_gray"]

    if save_artifacts:
        cv2.imwrite(normalized_path, canonical_color)

    # 5. QR Code Identification
    qr_result = decode_qr_code(canonical_gray, full_image_fallback=img_bgr)
    
    # If upside down (180 deg), rotate canonical images so bubbles and text are upright
    if qr_result.get("orientation_deg") == 180:
        canonical_color = cv2.rotate(canonical_color, cv2.ROTATE_180)
        canonical_gray = cv2.rotate(canonical_gray, cv2.ROTATE_180)
        if save_artifacts:
            cv2.imwrite(normalized_path, canonical_color)
    
    template_version = qr_result.get("template_version") or (exam_data.get("template_version") if exam_data else "OMR-V1")
    total_q = exam_data.get("number_of_questions", 50) if exam_data else 50
    choices = exam_data.get("choices", ["A", "B", "C", "D"]) if exam_data else ["A", "B", "C", "D"]

    template_spec = generate_template_spec(total_q, choices, template_version)

    # 6. Bubble Classification
    classification_result = classify_question_answers(
        canonical_gray,
        template_spec,
        calibration_params=calibration_params
    )

    # 7. Answer Key Evaluation & Score Calculation (Server-Side)
    detected_questions = classification_result["questions"]
    graded_answers = []
    
    correct_count = 0
    incorrect_count = 0
    blank_count = 0
    multiple_count = 0
    uncertain_count = 0
    total_score = 0.0
    max_possible_score = 0.0

    if answer_key_dict is None and exam_data and "answer_key" in exam_data:
        answer_key_dict = exam_data["answer_key"]

    if ungraded_questions is None:
        ungraded_questions = []

    # Generate cropped row images for items needing review or all
    review_row_crops = {}

    for q in detected_questions:
        q_num = q["question_num"]
        detected_ans = q["detected_answer"]
        q_status = q["status"]
        q_conf = q["confidence"]
        
        correct_ans = answer_key_dict.get(q_num) if answer_key_dict else None
        mark_value = question_marks_dict.get(q_num, 1.0) if question_marks_dict else 1.0
        is_ungraded = q_num in ungraded_questions

        eval_status = "UNKNOWN"
        is_correct = False
        question_score = 0.0

        if is_ungraded:
            eval_status = "UNGRADED"
        elif correct_ans is None:
            eval_status = "NOT_GRADED"
        else:
            max_possible_score += mark_value
            if q_status == "SELECTED":
                if detected_ans == correct_ans:
                    eval_status = "CORRECT"
                    is_correct = True
                    question_score = mark_value
                    correct_count += 1
                else:
                    eval_status = "INCORRECT"
                    incorrect_count += 1
            elif q_status == "MULTIPLE":
                eval_status = "MULTIPLE"
                is_correct = False
                question_score = 0.0
                incorrect_count += 1
                multiple_count += 1
            elif q_status == "BLANK":
                eval_status = "BLANK"
                is_correct = False
                question_score = 0.0
                blank_count += 1
            elif q_status == "UNCERTAIN":
                eval_status = "UNCERTAIN"
                is_correct = False
                question_score = 0.0
                uncertain_count += 1

        total_score += question_score

        # Save row crop snippet only if uncertain or multiple
        crop_filename = f"crop_{unique_id}_q{q_num}.jpg"
        crop_path = str(UPLOADS_DEBUG_DIR / crop_filename)
        if save_artifacts and (q_status in ["UNCERTAIN", "MULTIPLE"]):
            row_crop_bgr = extract_row_crop_image(canonical_color, q["crop_box"])
            cv2.imwrite(crop_path, row_crop_bgr)
            review_row_crops[q_num] = crop_filename

        graded_answers.append({
            "question_num": q_num,
            "machine_answer": detected_ans,
            "correct_answer": correct_ans,
            "machine_status": q_status,
            "eval_status": eval_status,
            "is_correct": is_correct,
            "score": round(question_score, 2),
            "mark_value": mark_value,
            "confidence": q_conf,
            "top_choice": q["top_choice"],
            "top_fill": q["top_fill"],
            "second_choice": q["second_choice"],
            "second_fill": q["second_fill"],
            "fill_delta": q["fill_delta"],
            "choices_metrics": q["choices_metrics"],
            "row_crop_path": review_row_crops.get(q_num),
            "final_answer": detected_ans,  # Defaults to machine answer before manual review
            "review_status": "AUTO_ACCEPTED" if q_status != "UNCERTAIN" else "NEEDS_REVIEW"
        })

    # 8. Render Visual Debug Overlay
    debug_overlay = generate_debug_overlay(
        canonical_color,
        template_spec,
        classification_result,
        answer_key_dict=answer_key_dict
    )
    debug_base64 = None
    if save_artifacts:
        cv2.imwrite(debug_path, debug_overlay)
        try:
            # Generate high-performance compressed preview data URL for web & mobile
            preview_img = cv2.resize(debug_overlay, (600, 850), interpolation=cv2.INTER_AREA)
            _, buf = cv2.imencode('.jpg', preview_img, [cv2.IMWRITE_JPEG_QUALITY, 78])
            debug_base64 = f"data:image/jpeg;base64,{base64.b64encode(buf).decode('utf-8')}"
        except Exception:
            pass

    percentage = round((total_score / max(0.001, max_possible_score)) * 100.0, 2) if max_possible_score > 0 else 0.0
    pass_mark = exam_data.get("pass_mark", 50.0) if exam_data else 50.0
    passed = percentage >= pass_mark

    overall_status = "COMPLETED"
    if classification_result["needs_review"] or uncertain_count > 0:
        overall_status = "NEEDS_REVIEW"

    return {
        "success": True,
        "status_code": "OMR_PROCESSED_SUCCESS",
        "message_ku": "پەڕەکە بە سەرکەوتوویی خوێندرایەوە",
        "overall_status": overall_status,
        "needs_review": classification_result["needs_review"],
        "sheet_id": qr_result.get("sheet_id") or f"SHEET-{unique_id}",
        "detected_exam_id": qr_result.get("exam_id"),
        "detected_student_id": qr_result.get("student_id"),
        "template_version": template_version,
        "original_image_path": original_filename,
        "normalized_image_path": normalized_filename,
        "debug_image_path": debug_filename,
        "debug_image_base64": debug_base64,
        "quality": quality_result,
        "skew_angle_deg": warp_result["skew_angle_deg"],
        "summary": {
            "total_questions": total_q,
            "correct_count": correct_count,
            "incorrect_count": incorrect_count,
            "blank_count": blank_count,
            "multiple_count": multiple_count,
            "uncertain_count": uncertain_count,
            "total_score": round(total_score, 2),
            "max_possible_score": round(max_possible_score, 2),
            "percentage": percentage,
            "passed": passed,
            "average_confidence": classification_result["average_confidence"]
        },
        "answers": graded_answers
    }

def regrade_pipeline_results(
    pipeline_res: Dict[str, Any],
    exam_data: Dict[str, Any],
    answer_key_dict: Dict[int, str],
    question_marks_dict: Optional[Dict[int, float]] = None,
    ungraded_questions: Optional[List[int]] = None
) -> Dict[str, Any]:
    """
    Instantly re-grades already extracted answers in-memory with a new answer key.
    Runs in < 0.1ms without re-executing heavy CV homography.
    """
    if not pipeline_res or not pipeline_res.get("success"):
        return pipeline_res

    question_marks_dict = question_marks_dict or {}
    ungraded_questions = ungraded_questions or []

    correct_count = 0
    incorrect_count = 0
    blank_count = 0
    multiple_count = 0
    uncertain_count = 0
    total_score = 0.0
    max_possible_score = 0.0

    updated_answers = []
    for a in pipeline_res.get("answers", []):
        q_num = a["question_num"]
        detected_ans = a["machine_answer"]
        q_status = a["machine_status"]

        correct_ans = answer_key_dict.get(q_num)
        mark_value = question_marks_dict.get(q_num, 1.0)
        is_ungraded = q_num in ungraded_questions

        eval_status = "UNKNOWN"
        is_correct = False
        question_score = 0.0

        if is_ungraded:
            eval_status = "UNGRADED"
        elif correct_ans is None:
            eval_status = "NOT_GRADED"
        else:
            max_possible_score += mark_value
            if q_status == "SELECTED":
                if detected_ans == correct_ans:
                    eval_status = "CORRECT"
                    is_correct = True
                    question_score = mark_value
                    correct_count += 1
                else:
                    eval_status = "INCORRECT"
                    incorrect_count += 1
            elif q_status == "MULTIPLE":
                eval_status = "MULTIPLE"
                is_correct = False
                question_score = 0.0
                incorrect_count += 1
                multiple_count += 1
            elif q_status == "BLANK":
                eval_status = "BLANK"
                is_correct = False
                question_score = 0.0
                blank_count += 1
            elif q_status == "UNCERTAIN":
                eval_status = "UNCERTAIN"
                is_correct = False
                question_score = 0.0
                uncertain_count += 1

        total_score += question_score

        new_a = dict(a)
        new_a["correct_answer"] = correct_ans
        new_a["eval_status"] = eval_status
        new_a["is_correct"] = is_correct
        new_a["score"] = round(question_score, 2)
        new_a["mark_value"] = mark_value
        updated_answers.append(new_a)

    percentage = round((total_score / max(0.001, max_possible_score)) * 100.0, 2) if max_possible_score > 0 else 0.0
    pass_mark = exam_data.get("pass_mark", 50.0) if exam_data else 50.0
    passed = percentage >= pass_mark

    pipeline_res["summary"].update({
        "correct_count": correct_count,
        "incorrect_count": incorrect_count,
        "blank_count": blank_count,
        "multiple_count": multiple_count,
        "uncertain_count": uncertain_count,
        "total_score": round(total_score, 2),
        "max_possible_score": round(max_possible_score, 2),
        "percentage": percentage,
        "passed": passed
    })
    pipeline_res["answers"] = updated_answers
    return pipeline_res
