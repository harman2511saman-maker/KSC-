"""
Standardized OMR Template Definitions for OMR Examination Platform.
Defines canonical coordinate system (1200 x 1700 px, A4 Aspect Ratio),
registration marker anchors, timing tracks, and bubble ROIs.
All geometry is deterministic and versioned (OMR-V1).
"""

from typing import Dict, List, Any, Tuple
from dataclasses import dataclass, asdict

CANONICAL_WIDTH = 1200
CANONICAL_HEIGHT = 1700

# Registration Markers: 4 solid black squares in four corners
# Size: 48 x 48 px with generous quiet zones
MARKER_SIZE = 48

MARKER_CENTERS = {
    "TL": (84, 84),
    "TR": (1116, 84),
    "BL": (84, 1616),
    "BR": (1116, 1616),
}

MARKER_BOXES = {
    "TL": (60, 60, 48, 48),
    "TR": (1092, 60, 48, 48),
    "BL": (60, 1592, 48, 48),
    "BR": (1092, 1592, 48, 48),
}

QR_REGION = {
    "x": 925,
    "y": 60,
    "w": 155,
    "h": 155,
}

@dataclass
class BubbleROI:
    choice: str
    cx: int
    cy: int
    radius: int
    inner_radius: int

@dataclass
class QuestionROI:
    question_num: int
    column_idx: int
    row_idx: int
    timing_mark_y: int
    bubbles: Dict[str, BubbleROI]

def generate_template_spec(
    total_questions: int = 50,
    choices: List[str] = None,
    template_version: str = "OMR-V1"
) -> Dict[str, Any]:
    if choices is None:
        choices = ["A", "B", "C", "D"]
    
    num_choices = len(choices)
    
    # Grid positioning: Header bar sits at Y=365..410, Row 0 starts at Y=445
    grid_start_y = 445
    row_height = 44

    # Determine balanced column layout based on question count
    if total_questions <= 30:
        # Split into 2 columns of up to 15 questions to balance the full A4 width
        num_columns = 2
        questions_per_col = (total_questions + 1) // 2
        col_start_x = [120, 615]
        col_width = 465
        choice_spacing_x = 70
        bubble_radius = 14
        inner_radius = 10
        label_offset_x = 32
        bubbles_offset_x = 118
    elif total_questions <= 50:
        # 2 columns of 25 questions (Standard A4 layout)
        num_columns = 2
        questions_per_col = 25
        col_start_x = [120, 615]
        col_width = 465
        choice_spacing_x = 70
        bubble_radius = 14
        inner_radius = 10
        label_offset_x = 32
        bubbles_offset_x = 118
    elif total_questions <= 75:
        # 3 columns of 25 questions
        num_columns = 3
        questions_per_col = 25
        col_start_x = [120, 445, 770]
        col_width = 310
        choice_spacing_x = 52
        bubble_radius = 12
        inner_radius = 8
        label_offset_x = 24
        bubbles_offset_x = 75
    else:
        # 4 columns of 25 questions (up to 100 questions)
        num_columns = 4
        questions_per_col = 25
        col_start_x = [120, 365, 610, 855]
        col_width = 225
        choice_spacing_x = 38
        bubble_radius = 11
        inner_radius = 7
        label_offset_x = 20
        bubbles_offset_x = 56

    questions: Dict[int, Dict[str, Any]] = {}
    timing_marks: List[Tuple[int, int, int, int]] = []  # (x, y, w, h)
    
    q_num = 1
    for col in range(num_columns):
        col_x = col_start_x[col]
        bubbles_x_start = col_x + bubbles_offset_x
        timing_x = col_x - 18 if num_columns <= 2 else (col_x - 14 if num_columns == 3 else col_x - 12)
        
        for row in range(questions_per_col):
            if q_num > total_questions:
                break
            
            row_cy = grid_start_y + (row * row_height)
            tw, th = (12, 14) if num_columns <= 2 else (10, 12)
            timing_marks.append((timing_x, row_cy - (th // 2), tw, th))
            
            question_bubbles: Dict[str, Any] = {}
            for c_idx, choice in enumerate(choices):
                bcx = bubbles_x_start + (c_idx * choice_spacing_x)
                bcy = row_cy
                question_bubbles[choice] = {
                    "choice": choice,
                    "cx": bcx,
                    "cy": bcy,
                    "radius": bubble_radius,
                    "inner_radius": inner_radius,
                    "x": bcx - bubble_radius,
                    "y": bcy - bubble_radius,
                    "w": bubble_radius * 2,
                    "h": bubble_radius * 2
                }
            
            questions[q_num] = {
                "question_num": q_num,
                "column_idx": col,
                "row_idx": row,
                "timing_mark_y": row_cy,
                "label_pos": (col_x + label_offset_x, row_cy),
                "bubbles": question_bubbles
            }
            q_num += 1

    return {
        "template_version": template_version,
        "canonical_width": CANONICAL_WIDTH,
        "canonical_height": CANONICAL_HEIGHT,
        "total_questions": total_questions,
        "choices": choices,
        "marker_size": MARKER_SIZE,
        "marker_centers": MARKER_CENTERS,
        "marker_boxes": MARKER_BOXES,
        "qr_region": QR_REGION,
        "timing_marks": timing_marks,
        "questions": questions,
        "col_layout": {
            "num_columns": num_columns,
            "col_start_x": col_start_x,
            "col_width": col_width,
            "questions_per_col": questions_per_col,
            "grid_start_y": grid_start_y,
            "row_height": row_height
        }
    }

# Default standard 50-question template OMR-V1
DEFAULT_OMR_V1_SPEC = generate_template_spec(50, ["A", "B", "C", "D"], "OMR-V1")
