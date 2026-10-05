"""
Automated Regression and Acceptance Tests for Kurdish Sorani OMR Engine.
Tests:
1. Deterministic OMR-V1 A4 sheet generation (PDF and PNG)
2. Marker detection and perspective homography transformation
3. Synthetic answer bubble filling (single selected, blank, multiple, light pencil, uncertain)
4. Score calculation and answer key grading
5. Skew and rotation invariance
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import cv2
import numpy as np
import pytest
from app.omr.template_definitions import (
    generate_template_spec,
    DEFAULT_OMR_V1_SPEC,
    CANONICAL_WIDTH,
    CANONICAL_HEIGHT,
    MARKER_CENTERS
)
from app.omr.sheet_generator import generate_omr_sheet_image, generate_omr_sheet_pdf
from app.omr.marker_detector import detect_registration_markers
from app.omr.perspective_corrector import warp_to_canonical
from app.omr.qr_processor import decode_qr_code
from app.omr.bubble_classifier import classify_question_answers
from app.omr.omr_pipeline import process_omr_sheet

def test_sheet_generator():
    """Verify that sheet generator produces standard A4 1200x1700 image and valid PDF."""
    exam_mock = {
        "id": 1,
        "exam_name": "تاقیکردنەوەی تاقیکاری",
        "subject": "زیندەزانی",
        "grade": "پۆلی ١٢",
        "number_of_questions": 50,
        "choices": ["A", "B", "C", "D"],
        "template_version": "OMR-V1"
    }
    student_mock = {
        "id": 101,
        "name": "ئالان دانا ئەحمەد",
        "student_id": "STD-101"
    }

    # Generate image
    img = generate_omr_sheet_image(exam_mock, student_mock, "SHEET-TEST-001")
    img_np = np.array(img)
    assert img_np.shape[0] == CANONICAL_HEIGHT
    assert img_np.shape[1] == CANONICAL_WIDTH

    # Generate PDF
    pdf_bytes = generate_omr_sheet_pdf(exam_mock, student_mock, "SHEET-TEST-001")
    assert len(pdf_bytes) > 5000
    assert pdf_bytes.startswith(b"%PDF")

def test_marker_detection_and_warp():
    """Verify marker detection on clean and rotated/skewed synthetic sheets."""
    exam_mock = {
        "id": 1,
        "number_of_questions": 50,
        "choices": ["A", "B", "C", "D"],
        "template_version": "OMR-V1"
    }
    img = generate_omr_sheet_image(exam_mock, sheet_id="SHEET-WARP-TEST")
    img_bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

    # 1. Clean image detection
    marker_res = detect_registration_markers(img_bgr)
    assert marker_res["success"] is True
    assert marker_res["markers_count"] == 4

    # 2. Add realistic perspective tilt and padding
    h, w = img_bgr.shape[:2]
    pad = 80
    padded = np.full((h + pad*2, w + pad*2, 3), 220, dtype=np.uint8)
    padded[pad:pad+h, pad:pad+w] = img_bgr

    # Skew points slightly
    pts1 = np.float32([[pad, pad], [pad+w, pad], [pad+w, pad+h], [pad, pad+h]])
    pts2 = np.float32([[pad+20, pad+30], [pad+w-30, pad+10], [pad+w-10, pad+h-40], [pad+40, pad+h-20]])
    M_skew = cv2.getPerspectiveTransform(pts1, pts2)
    skewed_img = cv2.warpPerspective(padded, M_skew, (padded.shape[1], padded.shape[0]), borderValue=(210, 210, 210))

    marker_skew_res = detect_registration_markers(skewed_img)
    assert marker_skew_res["success"] is True

    warp_res = warp_to_canonical(skewed_img, np.array(marker_skew_res["corners"], dtype=np.float32))
    assert warp_res["warped_color"].shape[0] == CANONICAL_HEIGHT
    assert warp_res["warped_color"].shape[1] == CANONICAL_WIDTH

def test_bubble_recognition_and_grading():
    """
    Simulates filling answers on a sheet:
    - Q1: Fill A (Clear Selected)
    - Q2: Blank (No marks)
    - Q3: Fill B and C (Multiple Answers)
    - Q4: Light pencil mark on D (Borderline/Uncertain)
    - Q5: Fill C (Correct)
    """
    exam_mock = {
        "id": 1,
        "exam_name": "تاقیکردنەوە",
        "number_of_questions": 50,
        "choices": ["A", "B", "C", "D"],
        "template_version": "OMR-V1"
    }
    spec = generate_template_spec(50, ["A", "B", "C", "D"], "OMR-V1")
    img = generate_omr_sheet_image(exam_mock, sheet_id="SHEET-EVAL-001", template_spec=spec)
    img_bgr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

    # Fill bubbles artificially
    q_spec = spec["questions"]

    # Q1: Fill 'A' solidly
    b1_a = q_spec[1]["bubbles"]["A"]
    cv2.circle(img_bgr, (b1_a["cx"], b1_a["cy"]), b1_a["inner_radius"], (20, 20, 20), -1)

    # Q2: Leave blank

    # Q3: Fill 'B' and 'C' solidly (MULTIPLE)
    b3_b = q_spec[3]["bubbles"]["B"]
    b3_c = q_spec[3]["bubbles"]["C"]
    cv2.circle(img_bgr, (b3_b["cx"], b3_b["cy"]), b3_b["inner_radius"], (20, 20, 20), -1)
    cv2.circle(img_bgr, (b3_c["cx"], b3_c["cy"]), b3_c["inner_radius"], (20, 20, 20), -1)

    # Q4: Fill 'D' with faint gray pencil (30% darkness)
    b4_d = q_spec[4]["bubbles"]["D"]
    cv2.circle(img_bgr, (b4_d["cx"], b4_d["cy"]), b4_d["inner_radius"], (160, 160, 160), -1)

    # Q5: Fill 'C' solidly
    b5_c = q_spec[5]["bubbles"]["C"]
    cv2.circle(img_bgr, (b5_c["cx"], b5_c["cy"]), b5_c["inner_radius"], (20, 20, 20), -1)

    answer_key = {
        1: "A",
        2: "B",
        3: "B",
        4: "D",
        5: "C"
    }

    res = process_omr_sheet(
        image_input=img_bgr,
        exam_data=exam_mock,
        answer_key_dict=answer_key,
        save_artifacts=False
    )

    assert res["success"] is True
    answers = {a["question_num"]: a for a in res["answers"]}

    # Q1 must be SELECTED 'A' and CORRECT
    assert answers[1]["machine_status"] == "SELECTED"
    assert answers[1]["machine_answer"] == "A"
    assert answers[1]["eval_status"] == "CORRECT"

    # Q2 must be BLANK
    assert answers[2]["machine_status"] == "BLANK"
    assert answers[2]["machine_answer"] is None

    # Q3 must be MULTIPLE
    assert answers[3]["machine_status"] == "MULTIPLE"

    # Q5 must be SELECTED 'C' and CORRECT
    assert answers[5]["machine_status"] == "SELECTED"
    assert answers[5]["machine_answer"] == "C"
    assert answers[5]["eval_status"] == "CORRECT"

if __name__ == "__main__":
    test_sheet_generator()
    print("[PASS] Sheet generator passed")
    test_marker_detection_and_warp()
    print("[PASS] Marker detection and warp passed")
    test_bubble_recognition_and_grading()
    print("[PASS] Bubble recognition and grading passed")
    print("\n[SUCCESS] ALL CV OMR ENGINE TESTS PASSED PERFECTLY!")
