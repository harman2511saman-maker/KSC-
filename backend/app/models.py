"""
SQLAlchemy Database Models for OMR Examination Platform.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name_ku = Column(String(128), nullable=False)
    role = Column(String(32), default="TEACHER")  # ADMIN, TEACHER, REVIEWER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SchoolClass(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), nullable=False)
    grade = Column(String(64), nullable=False)
    academic_year = Column(String(32), default="2025-2026")
    created_at = Column(DateTime, default=datetime.utcnow)

    students = relationship("Student", back_populates="school_class")
    exams = relationship("Exam", back_populates="school_class")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    grade = Column(String(64), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    academic_year = Column(String(32), default="2025-2026")
    qr_identifier = Column(String(128), nullable=True)
    status = Column(String(32), default="ACTIVE")  # ACTIVE, ARCHIVED
    created_at = Column(DateTime, default=datetime.utcnow)

    school_class = relationship("SchoolClass", back_populates="students")
    results = relationship("Result", back_populates="student")

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    exam_name = Column(String(128), nullable=False)
    subject = Column(String(128), nullable=False)
    grade = Column(String(64), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    academic_year = Column(String(32), default="2025-2026")
    exam_date = Column(String(32), nullable=True)
    number_of_questions = Column(Integer, default=50)
    choices = Column(String(64), default="A,B,C,D")  # Comma-separated
    total_marks = Column(Float, default=100.0)
    pass_mark = Column(Float, default=50.0)
    instructions = Column(Text, nullable=True)
    status = Column(String(32), default="DRAFT")  # DRAFT, ACTIVE, COMPLETED, ARCHIVED
    template_version = Column(String(32), default="OMR-V1")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    school_class = relationship("SchoolClass", back_populates="exams")
    questions = relationship("ExamQuestion", back_populates="exam", cascade="all, delete-orphan")
    results = relationship("Result", back_populates="exam")

class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)
    question_num = Column(Integer, nullable=False)
    correct_answer = Column(String(8), nullable=True)  # "A", "B", "C", "D"
    marks = Column(Float, default=1.0)
    is_ungraded = Column(Boolean, default=False)

    exam = relationship("Exam", back_populates="questions")

class GeneratedSheet(Base):
    __tablename__ = "generated_sheets"

    id = Column(Integer, primary_key=True, index=True)
    sheet_id = Column(String(64), unique=True, index=True, nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    qr_payload = Column(Text, nullable=True)
    file_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ScanJob(Base):
    __tablename__ = "scan_jobs"

    id = Column(String(64), primary_key=True, index=True)
    total_pages = Column(Integer, default=1)
    processed_pages = Column(Integer, default=0)
    successful_pages = Column(Integer, default=0)
    needs_review_pages = Column(Integer, default=0)
    failed_pages = Column(Integer, default=0)
    status = Column(String(32), default="QUEUED")  # QUEUED, PROCESSING, COMPLETED, FAILED
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    pages = relationship("ScanPage", back_populates="job", cascade="all, delete-orphan")

class ScanPage(Base):
    __tablename__ = "scan_pages"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(64), ForeignKey("scan_jobs.id"), nullable=False, index=True)
    page_index = Column(Integer, default=1)
    original_file = Column(String(255), nullable=True)
    normalized_file = Column(String(255), nullable=True)
    debug_file = Column(String(255), nullable=True)
    status = Column(String(32), default="COMPLETED")  # COMPLETED, NEEDS_REVIEW, FAILED
    failure_reason = Column(Text, nullable=True)
    qr_data_json = Column(Text, nullable=True)
    confidence_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("ScanJob", back_populates="pages")
    result = relationship("Result", back_populates="scan_page", uselist=False)
    detected_answers = relationship("DetectedAnswer", back_populates="scan_page", cascade="all, delete-orphan")

class DetectedAnswer(Base):
    __tablename__ = "detected_answers"

    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("scan_pages.id"), nullable=False, index=True)
    question_num = Column(Integer, nullable=False)
    machine_answer = Column(String(8), nullable=True)
    machine_status = Column(String(32), default="BLANK")  # SELECTED, BLANK, MULTIPLE, UNCERTAIN
    confidence = Column(Float, default=1.0)
    final_answer = Column(String(8), nullable=True)
    review_status = Column(String(32), default="AUTO_ACCEPTED")  # AUTO_ACCEPTED, NEEDS_REVIEW, REVIEWED_CORRECTED, REVIEWED_CONFIRMED
    reviewed_by = Column(String(64), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    crop_image_path = Column(String(255), nullable=True)

    scan_page = relationship("ScanPage", back_populates="detected_answers")

class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("scan_pages.id"), nullable=False, unique=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True, index=True)
    total_score = Column(Float, default=0.0)
    max_score = Column(Float, default=100.0)
    percentage = Column(Float, default=0.0)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    blank_count = Column(Integer, default=0)
    multiple_count = Column(Integer, default=0)
    uncertain_count = Column(Integer, default=0)
    status = Column(String(32), default="PASSED")  # PASSED, FAILED, NEEDS_REVIEW
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    scan_page = relationship("ScanPage", back_populates="result")
    exam = relationship("Exam", back_populates="results")
    student = relationship("Student", back_populates="results")

class ManualReview(Base):
    __tablename__ = "manual_reviews"

    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("scan_pages.id"), nullable=False, index=True)
    question_num = Column(Integer, nullable=False)
    original_answer = Column(String(8), nullable=True)
    reviewed_answer = Column(String(8), nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewer_name = Column(String(128), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(64), nullable=True)
    action = Column(String(64), nullable=False)  # EXAM_CREATED, ANSWER_KEY_EDITED, SCAN_PROCESSED, MANUAL_REVIEW, RESULT_EXPORTED
    entity = Column(String(64), nullable=False)
    entity_id = Column(String(64), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class OMRCalibration(Base):
    __tablename__ = "omr_calibrations"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(64), unique=True, nullable=False)
    value_json = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
