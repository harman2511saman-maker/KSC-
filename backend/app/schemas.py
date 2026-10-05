"""
Pydantic Schemas for Request / Response validation.
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

# Auth
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str
    full_name_ku: str
    role: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name_ku: str
    role: Optional[str] = "TEACHER"

class UserOut(BaseModel):
    id: int
    username: str
    full_name_ku: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Class / School
class ClassCreate(BaseModel):
    name: str
    grade: Optional[str] = "قوتابخانە"
    academic_year: Optional[str] = "2025-2026"

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    grade: Optional[str] = None
    academic_year: Optional[str] = None

class ClassOut(BaseModel):
    id: int
    name: str
    grade: Optional[str] = "قوتابخانە"
    academic_year: Optional[str] = "2025-2026"
    student_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True

# Student
class StudentCreate(BaseModel):
    student_id: str
    name: str
    grade: str
    class_id: Optional[Union[int, str]] = None
    academic_year: Optional[str] = "2025-2026"
    qr_identifier: Optional[str] = None
    status: Optional[str] = "ACTIVE"

    @field_validator('class_id', mode='before')
    def parse_class_id(cls, v):
        if v == "" or v is None or v == "null":
            return None
        return int(v) if str(v).isdigit() else None

class StudentOut(BaseModel):
    id: int
    student_id: str
    name: str
    grade: str
    class_id: Optional[int] = None
    class_name: Optional[str] = None
    academic_year: str
    qr_identifier: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Exam Question & Answer Key
class ExamQuestionItem(BaseModel):
    question_num: int
    correct_answer: Optional[str] = None  # "A", "B", "C", "D"
    marks: Optional[float] = 1.0
    is_ungraded: Optional[bool] = False

class AnswerKeyUpdate(BaseModel):
    questions: List[ExamQuestionItem]

# Exam
class ExamCreate(BaseModel):
    exam_name: str
    subject: str
    grade: str
    class_id: Optional[Union[int, str]] = None
    academic_year: Optional[str] = "2025-2026"
    exam_date: Optional[str] = None
    number_of_questions: Optional[int] = 50
    choices: Optional[str] = "A,B,C,D"
    total_marks: Optional[float] = 100.0
    pass_mark: Optional[float] = 50.0
    instructions: Optional[str] = None
    template_version: Optional[str] = "OMR-V1"

    @field_validator('class_id', mode='before')
    def parse_class_id(cls, v):
        if v == "" or v is None or v == "null":
            return None
        return int(v) if str(v).isdigit() else None

class ExamUpdate(BaseModel):
    exam_name: Optional[str] = None
    subject: Optional[str] = None
    grade: Optional[str] = None
    class_id: Optional[Union[int, str]] = None
    academic_year: Optional[str] = None
    exam_date: Optional[str] = None
    number_of_questions: Optional[int] = None
    choices: Optional[str] = None
    total_marks: Optional[float] = None
    pass_mark: Optional[float] = None
    instructions: Optional[str] = None
    status: Optional[str] = None

    @field_validator('class_id', mode='before')
    def parse_class_id(cls, v):
        if v == "" or v is None or v == "null":
            return None
        return int(v) if str(v).isdigit() else None

class ExamOut(BaseModel):
    id: int
    exam_name: str
    subject: str
    grade: str
    class_id: Optional[int] = None
    class_name: Optional[str] = None
    academic_year: str
    exam_date: Optional[str] = None
    number_of_questions: int
    choices: str
    total_marks: float
    pass_mark: float
    instructions: Optional[str] = None
    status: str
    template_version: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    questions_count: Optional[int] = 0
    answer_key_completed: Optional[bool] = False

    class Config:
        from_attributes = True

# Scanning & Results
class DetectedAnswerOut(BaseModel):
    id: Optional[int] = None
    question_num: int
    machine_answer: Optional[str] = None
    correct_answer: Optional[str] = None
    machine_status: str
    eval_status: Optional[str] = None
    confidence: float
    final_answer: Optional[str] = None
    review_status: str
    crop_image_path: Optional[str] = None
    score: Optional[float] = 0.0

    class Config:
        from_attributes = True

class ResultOut(BaseModel):
    id: int
    page_id: int
    exam_id: int
    exam_name: Optional[str] = None
    student_id: Optional[int] = None
    student_code: Optional[str] = None
    student_name: Optional[str] = None
    class_name: Optional[str] = None
    total_score: float
    max_score: float
    percentage: float
    correct_count: int
    incorrect_count: int
    blank_count: int
    multiple_count: int
    uncertain_count: int
    status: str
    created_at: datetime
    normalized_file: Optional[str] = None
    debug_file: Optional[str] = None
    answers: Optional[List[DetectedAnswerOut]] = []

    class Config:
        from_attributes = True

# Manual Review Request
class ManualReviewItem(BaseModel):
    question_num: int
    reviewed_answer: Optional[str] = None  # "A", "B", "C", "D" or None for Blank
    notes: Optional[str] = None

class ManualReviewSubmit(BaseModel):
    page_id: int
    reviews: List[ManualReviewItem]

# Calibration
class CalibrationSettings(BaseModel):
    min_fill_ratio: float = 0.35
    multiple_margin: float = 0.12
    uncertain_lower_bound: float = 0.25
    uncertain_upper_bound: float = 0.45
    blank_threshold: float = 0.18
    inner_radius_ratio: float = 0.65
    blur_laplacian_threshold: float = 60.0
    min_brightness: float = 35.0
    max_brightness: float = 240.0
    marker_size_tolerance: float = 0.35
