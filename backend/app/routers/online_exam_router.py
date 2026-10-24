"""
Online Live Examination Router for Kurdish Students Competition (KSC).
Features:
- Live scheduled exams with countdown and live status
- One-time automated passcode protection
- Single-direction (no go-back) question flow
- Per-question countdown timer
- Strict Anti-Cheat engine (tab switch / window unfocus detection)
- Automated image compression on upload (max 1200px, JPEG 75% quality)
- Final Telegram sheet submission screen with 5-minute countdown
"""

import os
import io
import uuid
import secrets
import string
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
import json
from sqlalchemy import desc
from PIL import Image

from app.config import UPLOADS_ONLINE_EXAMS_DIR
from app.database import get_db
from app.models import (
    OnlineExam, OnlineExamQuestion, OnlineExamPasscode, User,
    Exam, ExamQuestion, Student, SchoolClass, ScanJob, ScanPage, DetectedAnswer, Result
)
from app.auth import get_current_user, require_role, create_access_token

router = APIRouter(prefix="/api/online-exam", tags=["Online Exam"])

# In-memory brute force protection against passcode guessing
_failed_attempts: Dict[str, list] = defaultdict(list)

def check_brute_force(key: str):
    now = time.time()
    _failed_attempts[key] = [t for t in _failed_attempts[key] if now - t < 180]
    if len(_failed_attempts[key]) >= 5:
        raise HTTPException(
            status_code=429,
            detail="ژمارەی هەوڵە هەڵەکانت زۆرە! لەبەر پاراستنی پلاتفۆرم تکایە ٣ خولەک چاوەڕێ بکە."
        )

def record_failed_attempt(key: str):
    _failed_attempts[key].append(time.time())

# -------------------------------------------------------------
# PYDANTIC SCHEMAS
# -------------------------------------------------------------
class VerifyPasscodeRequest(BaseModel):
    exam_id: int
    code: str
    student_name: Optional[str] = ""
    student_phone: Optional[str] = None

class ReportCheatRequest(BaseModel):
    exam_id: int
    code: str
    reason: Optional[str] = "بەجێهێشتنی پەڕەی تاقیکردنەوە یان گۆڕینی تاب (Tab Switch / Window Unfocused)"

class QuestionItemSchema(BaseModel):
    order_num: int
    question_text: str
    image_url: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None

class ExamCreateOrUpdateSchema(BaseModel):
    title: str
    description: Optional[str] = ""
    sponsors_and_prizes: Optional[str] = ""
    start_time: datetime
    question_duration_seconds: int = 60
    telegram_group_url: Optional[str] = "https://t.me/KurdishOMR"
    telegram_submission_minutes: int = 5
    entry_cutoff_minutes: int = 3
    is_active: bool = True
    is_coming_soon: bool = False
    allow_screen_selection: bool = False
    exam_mode: Optional[str] = "ONLINE"

class SubmitOnlineExamRequest(BaseModel):
    exam_id: int
    code: str
    answers: Dict[str, Optional[str]] = {}

class PasscodeNameUpdateItem(BaseModel):
    id: int
    student_name: Optional[str] = ""

class BatchUpdatePasscodeNamesRequest(BaseModel):
    items: List[PasscodeNameUpdateItem]

class GeneratePasscodesRequest(BaseModel):
    count: int = 20

# -------------------------------------------------------------
# IMAGE COMPRESSION HELPER
# -------------------------------------------------------------
def compress_and_save_question_image(file_bytes: bytes, original_filename: str) -> str:
    """
    Compresses question images to optimized JPEG (max 1200px, 75% quality).
    Reduces 5MB+ phone photos to ~80-150KB for lightning fast loading.
    Does NOT affect OMR answer sheets or scanner images.
    """
    image = Image.open(io.BytesIO(file_bytes))
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    max_dim = 1200
    if image.width > max_dim or image.height > max_dim:
        image.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

    unique_filename = f"q_{uuid.uuid4().hex[:12]}.jpg"
    dest_path = UPLOADS_ONLINE_EXAMS_DIR / unique_filename

    with open(dest_path, "wb") as f:
        image.save(f, format="JPEG", quality=75, optimize=True)

    return f"/uploads/online_exams/{unique_filename}"

# Helper to generate readable, high-security passcode
def generate_passcode_string() -> str:
    digits = ''.join(secrets.choice(string.digits) for _ in range(4))
    letters = ''.join(secrets.choice(string.ascii_uppercase) for _ in range(2))
    return f"KSC-{digits}-{letters}"

def to_utc_naive(dt: Optional[datetime]) -> datetime:
    """Normalizes any incoming datetime to naive UTC for consistent database storage."""
    if dt is None:
        return datetime.utcnow()
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt

def format_datetime_iso(dt: Optional[datetime]) -> str:
    """Formats datetime as UTC ISO-8601 string with trailing 'Z' so all clients parse it accurately."""
    if not dt:
        return ""
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def get_or_create_linked_exam(online_exam: OnlineExam, db: Session) -> Exam:
    """Ensures each OnlineExam has an associated Exam record for results, leaderboard, and filters."""
    clean_title = (online_exam.title or "").strip()
    online_class = get_or_create_online_class(online_exam, db)

    if online_exam.linked_exam_id:
        existing = db.query(Exam).filter(Exam.id == online_exam.linked_exam_id).first()
        if existing:
            changed = False
            if existing.exam_name != clean_title or existing.subject != clean_title:
                existing.exam_name = clean_title
                existing.subject = clean_title
                changed = True
            if existing.class_id != online_class.id:
                existing.class_id = online_class.id
                changed = True
            if changed:
                db.commit()
            return existing

    matched = db.query(Exam).filter(Exam.exam_name == clean_title).first()
    if matched:
        online_exam.linked_exam_id = matched.id
        matched.subject = clean_title
        if matched.class_id != online_class.id:
            matched.class_id = online_class.id
        db.commit()
        return matched

    q_count = len(online_exam.questions) if online_exam.questions else 10
    new_exam = Exam(
        exam_name=clean_title,
        subject=clean_title,
        grade="ئۆنلاین",
        class_id=online_class.id,
        academic_year="2025-2026",
        number_of_questions=q_count,
        choices="A,B,C,D",
        total_marks=100.0,
        pass_mark=50.0,
        status="ACTIVE",
        template_version="ONLINE"
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)
    online_exam.linked_exam_id = new_exam.id
    db.commit()
    return new_exam

def get_or_create_online_class(online_exam: OnlineExam, db: Session) -> SchoolClass:
    """
    Creates or returns a dedicated SchoolClass for this specific online exam.
    Formatted clearly with the subject/exam title: 'ئۆنلاین: {online_exam.title}'.
    This ensures filters and dropdowns clearly display the exact subject on all devices.
    """
    clean_title = (online_exam.title or "").strip()
    target_name = f"ئۆنلاین: {clean_title}" if clean_title else "پلاتفۆرمی ئۆنلاینی KSC"

    # 1. Match exact name
    existing = db.query(SchoolClass).filter(SchoolClass.name == target_name).first()
    if existing:
        return existing

    # 2. Check if legacy generic class exists and rename it
    legacy = db.query(SchoolClass).filter(SchoolClass.name == "پلاتفۆرمی پێشبڕکێی ئۆنلاینی KSC").first()
    if legacy:
        legacy.name = target_name
        db.commit()
        db.refresh(legacy)
        return legacy

    # 3. Create fresh SchoolClass
    new_class = SchoolClass(
        name=target_name,
        grade="ئۆنلاین",
        academic_year="2025-2026"
    )
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return new_class

def sync_online_classes_and_exams(db: Session):
    """
    Migrates any generic 'پلاتفۆرمی پێشبڕکێی ئۆنلاینی KSC' classes and ensures all
    online exams have their own dedicated SchoolClass and linked Exam with the exact subject name.
    Syncs students and auto-backfills Result records for any passcodes that were completed.
    """
    try:
        online_exams = db.query(OnlineExam).all()
        for oe in online_exams:
            c = get_or_create_online_class(oe, db)
            base_e = get_or_create_linked_exam(oe, db)
            if base_e.class_id != c.id:
                base_e.class_id = c.id
                db.commit()

            # Link all students belonging to this online exam's passcodes to this specific class
            passcodes = db.query(OnlineExamPasscode).filter(OnlineExamPasscode.exam_id == oe.id).all()
            for p in passcodes:
                st = db.query(Student).filter(Student.student_id == p.code).first()
                if not st and (p.is_used or p.student_name):
                    st = Student(
                        student_id=p.code,
                        name=p.student_name or "بەشداربووی ئۆنلاین",
                        grade="ئۆنلاین",
                        class_id=c.id,
                        academic_year="2025-2026"
                    )
                    db.add(st)
                    db.commit()
                    db.refresh(st)
                elif st:
                    if st.class_id != c.id:
                        st.class_id = c.id
                    if p.student_name and st.name != p.student_name and p.student_name not in ["بەشداربووی KSC", "بەشداربووی ئۆنلاین"]:
                        st.name = p.student_name

                # Backfill Result if passcode has score or was submitted or has answers
                if st and (p.score is not None or p.submitted_at is not None or p.answers_json):
                    job_id = f"ONLINE_JOB_{base_e.id}_{p.id}"
                    job = db.query(ScanJob).filter(ScanJob.id == job_id).first()
                    if not job:
                        job = ScanJob(
                            id=job_id,
                            total_pages=1,
                            processed_pages=1,
                            status="COMPLETED"
                        )
                        db.add(job)
                        db.commit()

                    page = db.query(ScanPage).filter(ScanPage.job_id == job.id).first()
                    if not page:
                        page = ScanPage(
                            job_id=job.id,
                            page_index=1,
                            status="COMPLETED",
                            confidence_score=1.0
                        )
                        db.add(page)
                        db.commit()
                        db.refresh(page)

                    existing_res = db.query(Result).filter(Result.page_id == page.id).first()
                    if not existing_res:
                        score_val = p.score if p.score is not None else 0.0
                        perc_val = p.percentage if p.percentage is not None else score_val
                        status_val = "PASSED" if perc_val >= 50.0 else "FAILED"
                        questions_count = base_e.number_of_questions or 10
                        correct_count = round((perc_val / 100.0) * questions_count)
                        incorrect_count = max(0, questions_count - correct_count)
                        existing_res = Result(
                            page_id=page.id,
                            exam_id=base_e.id,
                            student_id=st.id,
                            total_score=score_val,
                            max_score=100.0,
                            percentage=perc_val,
                            correct_count=correct_count,
                            incorrect_count=incorrect_count,
                            blank_count=0,
                            multiple_count=0,
                            uncertain_count=0,
                            status=status_val
                        )
                        db.add(existing_res)
                        db.commit()

        db.commit()
    except Exception as e:
        db.rollback()

# -------------------------------------------------------------
# PUBLIC ENDPOINTS
# -------------------------------------------------------------
@router.get("/active")
@router.get("/current")
def get_active_online_exams(db: Session = Depends(get_db)):
    """
    Returns public list of active/upcoming online exams for carousel/slider display.
    Questions and passcodes are kept hidden from public.
    """
    sync_online_classes_and_exams(db)

    active_exams = db.query(OnlineExam).filter(OnlineExam.is_active == True).order_by(OnlineExam.start_time).all()

    formatted_exams = []
    for exam in active_exams:
        questions_count = db.query(OnlineExamQuestion).filter(OnlineExamQuestion.exam_id == exam.id).count()
        is_coming_soon = getattr(exam, 'is_coming_soon', False) or False

        passcodes_count = db.query(OnlineExamPasscode).filter(OnlineExamPasscode.exam_id == exam.id).count()
        used_passcodes_count = db.query(OnlineExamPasscode).filter(
            OnlineExamPasscode.exam_id == exam.id,
            OnlineExamPasscode.is_used == True
        ).count()
        now = datetime.utcnow()
        exam_start = to_utc_naive(exam.start_time)
        cutoff_m = getattr(exam, 'entry_cutoff_minutes', 3) or 3
        exam_duration_seconds = (questions_count * exam.question_duration_seconds) + (cutoff_m * 60)
        total_duration_minutes = round(exam_duration_seconds / 60) if exam_duration_seconds > 0 else 0
        seconds_since_start = (now - exam_start).total_seconds()
        time_ended = seconds_since_start > (exam_duration_seconds + 120) if (exam_start <= now and questions_count > 0) else False
        all_codes_finished = (passcodes_count > 0 and (passcodes_count - used_passcodes_count) == 0)
        is_ended = (time_ended or all_codes_finished) and not is_coming_soon and exam.is_active and questions_count > 0

        formatted_exams.append({
            "id": exam.id,
            "title": exam.title,
            "description": exam.description,
            "sponsors_and_prizes": exam.sponsors_and_prizes,
            "start_time": format_datetime_iso(exam.start_time),
            "question_duration_seconds": exam.question_duration_seconds,
            "telegram_group_url": exam.telegram_group_url,
            "telegram_submission_minutes": exam.telegram_submission_minutes,
            "questions_count": questions_count,
            "total_duration_minutes": total_duration_minutes,
            "entry_cutoff_minutes": cutoff_m,
            "is_active": exam.is_active,
            "is_coming_soon": is_coming_soon,
            "is_ended": is_ended,
            "all_codes_finished": all_codes_finished,
            "passcodes_count": passcodes_count,
            "used_passcodes_count": used_passcodes_count,
            "allow_screen_selection": getattr(exam, 'allow_screen_selection', False) or False,
            "exam_mode": getattr(exam, 'exam_mode', 'ONLINE') or 'ONLINE',
            "linked_exam_id": getattr(exam, 'linked_exam_id', None),
            "available_passcodes_count": passcodes_count - used_passcodes_count
        })

    primary = formatted_exams[0] if formatted_exams else {}
    return {
        **primary,
        "exams": formatted_exams,
        "total_active_exams": len(formatted_exams),
        "has_active_exam": len(formatted_exams) > 0
    }

@router.get("/exams/{exam_id}/public-solutions")
def get_public_exam_solutions(exam_id: int, db: Session = Depends(get_db)):
    """
    Public endpoint to view official questions and correct answer key for completed or active exams.
    Allows students, teachers, and public visitors to review exam questions and answers.
    """
    exam = db.query(OnlineExam).filter(OnlineExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")

    questions = db.query(OnlineExamQuestion).filter(
        OnlineExamQuestion.exam_id == exam.id
    ).order_by(OnlineExamQuestion.order_num).all()

    return {
        "exam_id": exam.id,
        "title": exam.title,
        "description": exam.description,
        "linked_exam_id": getattr(exam, 'linked_exam_id', None),
        "total_questions": len(questions),
        "questions": [
            {
                "order_num": q.order_num,
                "question_text": q.question_text,
                "image_url": q.image_url,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
                "correct_answer": q.correct_answer
            }
            for q in questions
        ]
    }

@router.get("/check-passcode")
def check_passcode_status(
    exam_id: int,
    code: str,
    db: Session = Depends(get_db)
):
    """
    Checks candidate passcode before starting exam:
    - Verifies whether passcode exists, is valid, is used, or is disqualified
    - Determines if admin pre-assigned a student name (has_admin_name)
    - Returns student_name if pre-assigned so client can LOCK it
    """
    clean_code = code.strip().upper()
    passcode = db.query(OnlineExamPasscode).filter(
        OnlineExamPasscode.exam_id == exam_id,
        OnlineExamPasscode.code == clean_code
    ).first()

    if not passcode:
        return {"valid": False, "found": False, "message": "پاسوۆردەکە هەڵەیە یان بوونی نییە"}

    raw_name = (passcode.student_name or "").strip()
    has_admin_name = bool(raw_name and raw_name not in ["بەشداربووی KSC", "بەشداربووی ئۆنلاین", "قوتابی"])

    return {
        "valid": True,
        "found": True,
        "is_used": bool(passcode.is_used),
        "disqualified": bool(passcode.disqualified),
        "disqualification_reason": passcode.disqualification_reason,
        "has_admin_name": has_admin_name,
        "student_name": raw_name if has_admin_name else ""
    }

@router.post("/verify-passcode")
def verify_passcode_and_start_exam(
    payload: VerifyPasscodeRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Validates candidate passcode, registers student session,
    and returns full questions for the exam.
    Passcodes are strictly single-use.
    Locks name if pre-assigned by admin; requires triple name if unassigned.
    """
    exam = db.query(OnlineExam).filter(OnlineExam.id == payload.exam_id).first()
    if not exam or not exam.is_active:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە یان ناچالاکە")

    now = datetime.utcnow()
    exam_start = to_utc_naive(exam.start_time)

    # 1. Check if start time has arrived (allow a 2-minute clock skew buffer)
    time_diff = (exam_start - now).total_seconds()
    if time_diff > 120:
        mins_remaining = int(time_diff / 60) + 1
        raise HTTPException(
            status_code=400,
            detail=f"وادەی دەستپێکردنی ئەم تاقیکردنەوەیە ماوە! هێشتا کاتی دەستپێکردن نەهاتووە."
        )

    # 2. Check if late entry cutoff window has passed (EXPLICIT USER REQUIREMENT)
    cutoff_mins = getattr(exam, 'entry_cutoff_minutes', 3) or 3
    cutoff_seconds = cutoff_mins * 60
    seconds_since_start = (now - exam_start).total_seconds()
    if seconds_since_start > cutoff_seconds:
        raise HTTPException(
            status_code=403,
            detail="تاقیکردنەوە دەستی پێکردووە و دەرگای بەشداری داخراوە! ناتوانیت بەشداری بکەیت، لە تاقیکردنەوەی داهاتوو بەشداری بکە."
        )

    # 3. Brute force guard per IP
    client_ip = request.client.host if request.client else "unknown"
    check_brute_force(f"{client_ip}:{exam.id}")

    clean_code = payload.code.strip().upper()
    passcode = db.query(OnlineExamPasscode).filter(
        OnlineExamPasscode.exam_id == exam.id,
        OnlineExamPasscode.code == clean_code
    ).first()

    if not passcode:
        record_failed_attempt(f"{client_ip}:{exam.id}")
        time.sleep(0.3)
        raise HTTPException(status_code=404, detail="پاسوۆردەکە هەڵەیە! تکایە دڵنیابەرەوە لە کۆدەکەت.")

    if passcode.disqualified:
        raise HTTPException(
            status_code=403,
            detail=f"ئەم هەژمارە لە تاقیکردنەوە دەرکراوە: {passcode.disqualification_reason or 'غەشکردن'}"
        )

    if passcode.is_used:
        raise HTTPException(
            status_code=400,
            detail="ئەم پاسوۆردە پێشتر بەکارهاتووە! هەر پاسوۆردێک تەنها بۆ یەک بەشداربووە."
        )

    # 4. Strict Admin-Assigned Name Locking vs Required Triple Name Entry
    raw_existing_name = (passcode.student_name or "").strip()
    has_admin_name = bool(raw_existing_name and raw_existing_name not in ["بەشداربووی KSC", "بەشداربووی ئۆنلاین", "قوتابی"])

    if has_admin_name:
        # LOCKED: Keep admin's pre-assigned name strictly
        passcode.student_name = raw_existing_name
    else:
        # If admin did NOT assign a name, participant MUST write their full name
        submitted_name = (payload.student_name or "").strip()
        if submitted_name and submitted_name not in ["بەشداربووی KSC", "بەشداربووی ئۆنلاین"]:
            passcode.student_name = submitted_name
        else:
            raise HTTPException(
                status_code=400,
                detail="تکایە ناوی سیانی خۆت بنووسە بۆ ئەوەی لە ئەنجامەکان و ڕیزبەندی بە ناوی خۆت تۆمار بکرێت."
            )

    # Consume passcode
    passcode.is_used = True
    passcode.used_at = now

    if payload.student_phone and payload.student_phone.strip():
        passcode.student_phone = payload.student_phone.strip()
    db.commit()

    # Pre-link or create linked base Exam for unified results and leaderboard
    base_exam = get_or_create_linked_exam(exam, db)

    # Ensure online school class and pre-register Student record
    online_class = get_or_create_online_class(exam, db)

    student = db.query(Student).filter(Student.student_id == passcode.code).first()
    if not student:
        student = Student(
            student_id=passcode.code,
            name=passcode.student_name,
            grade="ئۆنلاین",
            class_id=online_class.id,
            academic_year="2025-2026"
        )
        db.add(student)
        db.commit()
    else:
        student.name = passcode.student_name
        student.class_id = online_class.id
        db.commit()

    # Fetch questions ordered by order_num
    questions = db.query(OnlineExamQuestion).filter(
        OnlineExamQuestion.exam_id == exam.id
    ).order_by(OnlineExamQuestion.order_num).all()

    token = create_access_token(
        data={
            "sub": passcode.student_name,
            "passcode_id": passcode.id,
            "exam_id": exam.id,
            "role": "ONLINE_STUDENT"
        }
    )

    return {
        "success": True,
        "session_token": token,
        "student_name": passcode.student_name,
        "passcode_id": passcode.id,
        "passcode_code": passcode.code,
        "code": passcode.code,
        "exam": {
            "id": exam.id,
            "title": exam.title,
            "question_duration_seconds": exam.question_duration_seconds,
            "telegram_group_url": exam.telegram_group_url,
            "telegram_submission_minutes": exam.telegram_submission_minutes,
            "allow_screen_selection": getattr(exam, 'allow_screen_selection', False) or False,
            "exam_mode": getattr(exam, 'exam_mode', 'ONLINE') or 'ONLINE',
            "linked_exam_id": base_exam.id,
            "total_questions": len(questions),
            "questions": [
                {
                    "order_num": q.order_num,
                    "question_text": q.question_text,
                    "image_url": q.image_url,
                    "option_a": q.option_a,
                    "option_b": q.option_b,
                    "option_c": q.option_c,
                    "option_d": q.option_d
                }
                for q in questions
            ]
        }
    }

@router.post("/report-cheat")
def report_cheating_violation(payload: ReportCheatRequest, db: Session = Depends(get_db)):
    """
    Called when candidate switches tab, minimizes, or leaves exam window.
    Immediately disqualifies the candidate passcode permanently.
    """
    clean_code = payload.code.strip().upper()
    code_id = int(clean_code) if clean_code.isdigit() else -1
    passcode = db.query(OnlineExamPasscode).filter(
        OnlineExamPasscode.exam_id == payload.exam_id,
        (OnlineExamPasscode.code == clean_code) | (OnlineExamPasscode.id == code_id)
    ).first()

    if passcode:
        passcode.disqualified = True
        passcode.disqualification_reason = payload.reason or "بەجێهێشتنی پەڕەی تاقیکردنەوە یان گۆڕینی تاب"
        db.commit()

    return {
        "disqualified": True,
        "message_ku": "ببورە بەهۆی غەشکردن لە تاقیکردنەوە دەرکرای"
    }

@router.post("/submit")
def submit_online_exam(payload: SubmitOnlineExamRequest, db: Session = Depends(get_db)):
    """
    Submits student online exam answers, instantly grades them,
    and records results into the unified Result & Competitions Leaderboard.
    """
    exam = db.query(OnlineExam).filter(OnlineExam.id == payload.exam_id).first()
    if not exam or not exam.is_active:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە یان ناچالاکە")

    clean_code = payload.code.strip().upper()
    code_id = int(clean_code) if clean_code.isdigit() else -1
    passcode = db.query(OnlineExamPasscode).filter(
        OnlineExamPasscode.exam_id == exam.id,
        (OnlineExamPasscode.code == clean_code) | (OnlineExamPasscode.id == code_id)
    ).first()

    if not passcode:
        raise HTTPException(status_code=404, detail="کۆدی پاسوۆرد نەدۆزرایەوە")

    if passcode.disqualified:
        raise HTTPException(
            status_code=403,
            detail=f"ئەم هەژمارە لە تاقیکردنەوە دەرکراوە: {passcode.disqualification_reason or 'غەشکردن'}"
        )

    questions = db.query(OnlineExamQuestion).filter(
        OnlineExamQuestion.exam_id == exam.id
    ).order_by(OnlineExamQuestion.order_num).all()

    total_q = len(questions) if len(questions) > 0 else 1
    points_per_q = 100.0 / total_q

    correct_count = 0
    incorrect_count = 0
    blank_count = 0
    question_details = []

    for q in questions:
        user_choice = payload.answers.get(str(q.order_num)) or payload.answers.get(q.order_num)
        clean_choice = user_choice.strip().upper() if user_choice and user_choice.strip() else None
        correct_ans = q.correct_answer.strip().upper() if q.correct_answer and q.correct_answer.strip() else None

        is_correct = False
        if not clean_choice:
            blank_count += 1
        elif correct_ans and clean_choice == correct_ans:
            is_correct = True
            correct_count += 1
        else:
            incorrect_count += 1

        question_details.append({
            "order_num": q.order_num,
            "question_text": q.question_text,
            "image_url": q.image_url,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "selected_answer": clean_choice,
            "correct_answer": correct_ans,
            "is_correct": is_correct
        })

    total_score = round(correct_count * points_per_q, 1)
    percentage = round((correct_count / total_q) * 100.0, 1)
    exam_status = "PASSED" if percentage >= 50.0 else "FAILED"

    # Save to passcode record
    passcode.score = total_score
    passcode.percentage = percentage
    passcode.submitted_at = datetime.utcnow()
    passcode.answers_json = json.dumps(payload.answers, ensure_ascii=False)

    # Ensure online school class exists with exact exam title
    online_class = get_or_create_online_class(exam, db)

    # Ensure linked base Exam exists and is synced with class
    base_exam = get_or_create_linked_exam(exam, db)
    if base_exam.class_id != online_class.id:
        base_exam.class_id = online_class.id
        db.commit()

    # Find or create Student record
    student = db.query(Student).filter(Student.student_id == passcode.code).first()
    if not student:
        student = Student(
            student_id=passcode.code,
            name=passcode.student_name or "بەشداربووی ئۆنلاین",
            grade="ئۆنلاین",
            class_id=online_class.id,
            academic_year="2025-2026"
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    else:
        student.class_id = online_class.id
        if passcode.student_name and student.name != passcode.student_name:
            student.name = passcode.student_name
            db.commit()

    # Ensure ScanJob & ScanPage exist for the Result relation
    job_id = f"ONLINE_JOB_{base_exam.id}_{passcode.id}"
    job = db.query(ScanJob).filter(ScanJob.id == job_id).first()
    if not job:
        job = ScanJob(
            id=job_id,
            total_pages=1,
            processed_pages=1,
            status="COMPLETED"
        )
        db.add(job)
        db.commit()

    page = db.query(ScanPage).filter(ScanPage.job_id == job.id).first()
    if not page:
        page = ScanPage(
            job_id=job.id,
            page_index=1,
            status="COMPLETED",
            confidence_score=1.0
        )
        db.add(page)
        db.commit()
        db.refresh(page)

    # Record DetectedAnswers for admin result inspection
    db.query(DetectedAnswer).filter(DetectedAnswer.page_id == page.id).delete()
    for q in questions:
        user_choice = payload.answers.get(str(q.order_num)) or payload.answers.get(q.order_num)
        clean_choice = user_choice.strip().upper() if user_choice and user_choice.strip() else None
        db.add(DetectedAnswer(
            page_id=page.id,
            question_num=q.order_num,
            machine_answer=clean_choice,
            final_answer=clean_choice,
            confidence=1.0,
            review_status="AUTO_ACCEPTED"
        ))

    # Create or update Result record
    result = db.query(Result).filter(Result.page_id == page.id).first()
    if not result:
        result = Result(
            page_id=page.id,
            exam_id=base_exam.id,
            student_id=student.id,
            total_score=total_score,
            max_score=100.0,
            percentage=percentage,
            correct_count=correct_count,
            incorrect_count=incorrect_count,
            blank_count=blank_count,
            multiple_count=0,
            uncertain_count=0,
            status=exam_status
        )
        db.add(result)
    else:
        result.total_score = total_score
        result.percentage = percentage
        result.correct_count = correct_count
        result.incorrect_count = incorrect_count
        result.blank_count = blank_count
        result.status = exam_status

    db.commit()

    # Calculate real-time rank of student in this exam
    higher_count = db.query(Result).filter(
        Result.exam_id == base_exam.id,
        Result.percentage > percentage
    ).count()
    rank = higher_count + 1
    total_participants = db.query(Result).filter(Result.exam_id == base_exam.id).count()

    return {
        "success": True,
        "message": "تاقیکردنەوەکەت بە سەرکەوتوویی تەواو کرا و نمرەکەت تۆمار کرا",
        "exam_title": exam.title,
        "linked_exam_id": base_exam.id,
        "student_name": passcode.student_name,
        "student_code": passcode.code,
        "score": total_score,
        "max_score": 100.0,
        "percentage": percentage,
        "correct_count": correct_count,
        "incorrect_count": incorrect_count,
        "blank_count": blank_count,
        "total_questions": len(questions),
        "status": exam_status,
        "rank": rank,
        "total_participants": total_participants,
        "questions_details": question_details
    }

# -------------------------------------------------------------
# ADMIN MANAGEMENT ENDPOINTS
# -------------------------------------------------------------
@router.get("/admin/exams")
def admin_get_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin endpoint to list all online exams."""
    exams = db.query(OnlineExam).order_by(desc(OnlineExam.created_at)).all()
    results = []
    for exam in exams:
        q_count = db.query(OnlineExamQuestion).filter(OnlineExamQuestion.exam_id == exam.id).count()
        total_codes = db.query(OnlineExamPasscode).filter(OnlineExamPasscode.exam_id == exam.id).count()
        used_codes = db.query(OnlineExamPasscode).filter(
            OnlineExamPasscode.exam_id == exam.id,
            OnlineExamPasscode.is_used == True
        ).count()
        results.append({
            "id": exam.id,
            "title": exam.title,
            "description": exam.description,
            "sponsors_and_prizes": exam.sponsors_and_prizes,
            "start_time": format_datetime_iso(exam.start_time),
            "question_duration_seconds": exam.question_duration_seconds,
            "telegram_group_url": exam.telegram_group_url,
            "telegram_submission_minutes": exam.telegram_submission_minutes,
            "entry_cutoff_minutes": getattr(exam, 'entry_cutoff_minutes', 3) or 3,
            "is_active": exam.is_active,
            "is_coming_soon": getattr(exam, 'is_coming_soon', False) or False,
            "allow_screen_selection": getattr(exam, 'allow_screen_selection', False) or False,
            "exam_mode": getattr(exam, 'exam_mode', 'ONLINE') or 'ONLINE',
            "linked_exam_id": getattr(exam, 'linked_exam_id', None),
            "questions_count": q_count,
            "passcodes_count": total_codes,
            "used_passcodes_count": used_codes,
            "available_passcodes_count": total_codes - used_codes
        })
    return results

@router.post("/admin/exams")
def admin_create_exam(
    payload: ExamCreateOrUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin creates a new online exam."""
    exam = OnlineExam(
        title=payload.title,
        description=payload.description,
        sponsors_and_prizes=payload.sponsors_and_prizes,
        start_time=to_utc_naive(payload.start_time),
        question_duration_seconds=payload.question_duration_seconds,
        telegram_group_url=payload.telegram_group_url,
        telegram_submission_minutes=payload.telegram_submission_minutes,
        entry_cutoff_minutes=payload.entry_cutoff_minutes,
        is_active=payload.is_active,
        is_coming_soon=payload.is_coming_soon,
        allow_screen_selection=payload.allow_screen_selection,
        exam_mode=payload.exam_mode or "ONLINE"
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    get_or_create_linked_exam(exam, db)
    get_or_create_online_class(exam, db)
    return {"message": "تاقیکردنەوە بە سەرکەوتوویی دروستکرا", "exam_id": exam.id}

@router.put("/admin/exams/{exam_id}")
def admin_update_exam(
    exam_id: int,
    payload: ExamCreateOrUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin updates existing online exam metadata and syncs class and exam names."""
    exam = db.query(OnlineExam).filter(OnlineExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")

    old_title = (exam.title or "").strip()
    clean_title = (payload.title or "").strip()
    exam.title = clean_title
    exam.description = payload.description
    exam.sponsors_and_prizes = payload.sponsors_and_prizes
    exam.start_time = to_utc_naive(payload.start_time)
    exam.question_duration_seconds = payload.question_duration_seconds
    exam.telegram_group_url = payload.telegram_group_url
    exam.telegram_submission_minutes = payload.telegram_submission_minutes
    exam.entry_cutoff_minutes = payload.entry_cutoff_minutes
    exam.is_active = payload.is_active
    exam.is_coming_soon = payload.is_coming_soon
    exam.allow_screen_selection = payload.allow_screen_selection
    exam.exam_mode = payload.exam_mode or "ONLINE"

    base_exam = get_or_create_linked_exam(exam, db)
    base_exam.exam_name = clean_title
    base_exam.subject = clean_title

    # Sync corresponding SchoolClass name
    old_class_name = f"ئۆنلاین: {old_title}"
    new_class_name = f"ئۆنلاین: {clean_title}"
    c = db.query(SchoolClass).filter(
        (SchoolClass.name == old_class_name) | 
        (SchoolClass.name == "پلاتفۆرمی پێشبڕکێی ئۆنلاینی KSC")
    ).first()
    if c:
        c.name = new_class_name
    else:
        get_or_create_online_class(exam, db)

    db.commit()
    return {"message": "تاقیکردنەوە نوێکرایەوە"}

@router.delete("/admin/exams/{exam_id}")
def admin_delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin deletes an exam and purges all its questions, passcodes, and uploaded images from disk."""
    exam = db.query(OnlineExam).filter(OnlineExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")

    # 1. Clean up all question images from disk so server disk stays clean
    questions = db.query(OnlineExamQuestion).filter(OnlineExamQuestion.exam_id == exam_id).all()
    for q in questions:
        if q.image_url:
            filename = os.path.basename(q.image_url)
            file_path = UPLOADS_ONLINE_EXAMS_DIR / filename
            if file_path.exists():
                try:
                    file_path.unlink()
                except Exception:
                    pass

    # 2. Delete passcodes, questions, and the exam record
    db.query(OnlineExamPasscode).filter(OnlineExamPasscode.exam_id == exam_id).delete()
    db.query(OnlineExamQuestion).filter(OnlineExamQuestion.exam_id == exam_id).delete()
    db.delete(exam)
    db.commit()
    return {"message": "تاقیکردنەوە و سەرجەم فایل و داتاکانی لە سێرڤەر بە سەرکەوتوویی سڕانەوە"}

@router.get("/admin/exams/{exam_id}/questions")
def admin_get_questions(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin gets all questions for an exam."""
    questions = db.query(OnlineExamQuestion).filter(
        OnlineExamQuestion.exam_id == exam_id
    ).order_by(OnlineExamQuestion.order_num).all()

    return [
        {
            "id": q.id,
            "order_num": q.order_num,
            "question_text": q.question_text,
            "image_url": q.image_url,
            "option_a": q.option_a or "",
            "option_b": q.option_b or "",
            "option_c": q.option_c or "",
            "option_d": q.option_d or "",
            "correct_answer": q.correct_answer or ""
        }
        for q in questions
    ]

@router.put("/admin/exams/{exam_id}/questions")
def admin_save_questions(
    exam_id: int,
    questions_list: List[QuestionItemSchema],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin replaces/saves all questions for an exam, automatically removing deleted images from disk."""
    exam = db.query(OnlineExam).filter(OnlineExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")

    # Clean up removed images from disk
    existing_questions = db.query(OnlineExamQuestion).filter(OnlineExamQuestion.exam_id == exam_id).all()
    new_image_urls = set(q.image_url for q in questions_list if q.image_url)
    for eq in existing_questions:
        if eq.image_url and eq.image_url not in new_image_urls:
            filename = os.path.basename(eq.image_url)
            file_path = UPLOADS_ONLINE_EXAMS_DIR / filename
            if file_path.exists():
                try:
                    file_path.unlink()
                except Exception:
                    pass

    # Remove existing questions
    db.query(OnlineExamQuestion).filter(OnlineExamQuestion.exam_id == exam_id).delete()

    # Insert new questions
    for idx, q_data in enumerate(questions_list):
        new_q = OnlineExamQuestion(
            exam_id=exam_id,
            order_num=idx + 1,
            question_text=q_data.question_text,
            image_url=q_data.image_url,
            option_a=q_data.option_a,
            option_b=q_data.option_b,
            option_c=q_data.option_c,
            option_d=q_data.option_d,
            correct_answer=q_data.correct_answer
        )
        db.add(new_q)

    # Sync base exam questions for unified leaderboard and results
    base_exam = get_or_create_linked_exam(exam, db)
    base_exam.number_of_questions = len(questions_list)
    db.query(ExamQuestion).filter(ExamQuestion.exam_id == base_exam.id).delete()
    mark_per_q = round(100.0 / max(1, len(questions_list)), 2)
    for idx, q_data in enumerate(questions_list):
        db.add(ExamQuestion(
            exam_id=base_exam.id,
            question_num=idx + 1,
            correct_answer=q_data.correct_answer.upper().strip() if q_data.correct_answer else "A",
            marks=mark_per_q
        ))

    db.commit()
    return {"message": "پرسیارەکان بە سەرکەوتوویی پاشەکەوت کران", "count": len(questions_list)}

@router.post("/admin/upload-question-image")
async def admin_upload_question_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """
    Admin endpoint to upload question images.
    Auto-compresses to small web-friendly JPEG (<150KB).
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="ناوی فایل نادیارە")

    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="قەبارەی وێنە نابێت زیاتر بێت لە ١٥ مێگابایت")

    try:
        compressed_url = compress_and_save_question_image(content, file.filename)
        return {
            "success": True,
            "url": compressed_url,
            "message_ku": "وێنەکە بە سەرکەوتوویی پەستێنرا و پاشەکەوت کرا"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"هەڵە لە پەستاندنی وێنە: {str(e)}")

@router.get("/admin/exams/{exam_id}/passcodes")
def admin_get_passcodes(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin gets all passcodes for an exam."""
    passcodes = db.query(OnlineExamPasscode).filter(
        OnlineExamPasscode.exam_id == exam_id
    ).order_by(desc(OnlineExamPasscode.created_at)).all()

    return [
        {
            "id": p.id,
            "code": p.code,
            "is_used": p.is_used,
            "used_at": p.used_at.isoformat() if p.used_at else None,
            "student_name": p.student_name,
            "student_phone": p.student_phone,
            "disqualified": p.disqualified,
            "disqualification_reason": p.disqualification_reason,
            "created_at": p.created_at.isoformat()
        }
        for p in passcodes
    ]

@router.post("/admin/exams/{exam_id}/generate-passcodes")
def admin_generate_passcodes(
    exam_id: int,
    payload: GeneratePasscodesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """
    Generates N automated unique passcodes for an exam.
    Example: KSC-9382-AP
    """
    exam = db.query(OnlineExam).filter(OnlineExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")

    count = min(max(payload.count, 1), 500)
    created_codes = []

    for _ in range(count):
        # Ensure uniqueness
        for attempt in range(10):
            candidate = generate_passcode_string()
            exists = db.query(OnlineExamPasscode).filter(OnlineExamPasscode.code == candidate).first()
            if not exists:
                new_passcode = OnlineExamPasscode(
                    exam_id=exam_id,
                    code=candidate,
                    is_used=False
                )
                db.add(new_passcode)
                created_codes.append(candidate)
                break

    db.commit()
    return {
        "success": True,
        "message_ku": f"ژمارەی {len(created_codes)} پاسوۆردی نوێ بە سەرکەوتوویی دروستکرا",
        "generated_codes": created_codes
    }

@router.delete("/admin/passcodes/{passcode_id}")
def admin_delete_passcode(
    passcode_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin deletes a specific passcode."""
    passcode = db.query(OnlineExamPasscode).filter(OnlineExamPasscode.id == passcode_id).first()
    if not passcode:
        raise HTTPException(status_code=404, detail="پاسوۆرد نەدۆزرایەوە")
    db.delete(passcode)
    db.commit()
    return {"message": "پاسوۆرد سڕایەوە"}

@router.post("/admin/exams/{exam_id}/clear-passcodes")
def admin_clear_passcodes(
    exam_id: int,
    clear_type: str = Body(default="used", embed=True),  # 'used' or 'all'
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin cleans up passcodes for an exam."""
    q = db.query(OnlineExamPasscode).filter(OnlineExamPasscode.exam_id == exam_id)
    if clear_type == "used":
        q = q.filter(OnlineExamPasscode.is_used == True)
    count = q.delete()
    db.commit()
    return {"message": f"{count} پاسوۆرد سڕانەوە"}

@router.put("/admin/exams/{exam_id}/passcodes/names")
def admin_batch_update_passcode_names(
    exam_id: int,
    payload: BatchUpdatePasscodeNamesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin updates assigned student names for passcodes."""
    for item in payload.items:
        pc = db.query(OnlineExamPasscode).filter(
            OnlineExamPasscode.id == item.id,
            OnlineExamPasscode.exam_id == exam_id
        ).first()
        if pc:
            clean_name = item.student_name.strip() if item.student_name else None
            pc.student_name = clean_name
    db.commit()
    return {"message": "ناوی قوتابییان بە سەرکەوتوویی پاشەکەوت کران"}
