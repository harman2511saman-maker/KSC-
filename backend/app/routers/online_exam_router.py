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
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from PIL import Image

from app.config import UPLOADS_ONLINE_EXAMS_DIR
from app.database import get_db
from app.models import OnlineExam, OnlineExamQuestion, OnlineExamPasscode, User
from app.auth import get_current_user, require_role, create_access_token

router = APIRouter(prefix="/api/online-exam", tags=["Online Exam"])

# -------------------------------------------------------------
# PYDANTIC SCHEMAS
# -------------------------------------------------------------
class VerifyPasscodeRequest(BaseModel):
    exam_id: int
    code: str
    student_name: str
    student_phone: Optional[str] = None

class ReportCheatRequest(BaseModel):
    exam_id: int
    code: str
    reason: Optional[str] = "بەجێهێشتنی پەڕەی تاقیکردنەوە یان گۆڕینی تاب (Tab Switch / Window Unfocused)"

class QuestionItemSchema(BaseModel):
    order_num: int
    question_text: str
    image_url: Optional[str] = None

class ExamCreateOrUpdateSchema(BaseModel):
    title: str
    description: Optional[str] = ""
    sponsors_and_prizes: Optional[str] = ""
    start_time: datetime
    question_duration_seconds: int = 60
    telegram_group_url: Optional[str] = "https://t.me/KurdishOMR"
    telegram_submission_minutes: int = 5
    is_active: bool = True

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
    active_exams = db.query(OnlineExam).filter(OnlineExam.is_active == True).order_by(OnlineExam.start_time).all()
    if not active_exams:
        default_exam = OnlineExam(
            title="خولی فەرمیی پێشبڕکێی ئۆنلاینی KSC",
            description="تاقیکردنەوەی ڕاستەوخۆ بە شێوازی فۆڕمی وەڵام (پەڕەی سۆما OMR). پرسیارەکان لەسەر شاشە دەردەکەون و لەسەر پەڕەی سۆما بازنەکان پڕدەکرێنەوە.",
            sponsors_and_prizes="سپۆنسەری فەرمی: پلاتفۆرمی KSC • خەڵاتی شایستە و بڕوانامەی فەرمی بۆ قوتابییە یەکەمەکان",
            start_time=datetime.utcnow(),
            question_duration_seconds=60,
            telegram_group_url="https://t.me/KurdishOMR",
            telegram_submission_minutes=5,
            is_active=True
        )
        db.add(default_exam)
        db.commit()
        db.refresh(default_exam)
        active_exams = [default_exam]

    formatted_exams = []
    for exam in active_exams:
        questions_count = db.query(OnlineExamQuestion).filter(OnlineExamQuestion.exam_id == exam.id).count()
        passcodes_count = db.query(OnlineExamPasscode).filter(OnlineExamPasscode.exam_id == exam.id).count()
        used_passcodes_count = db.query(OnlineExamPasscode).filter(
            OnlineExamPasscode.exam_id == exam.id,
            OnlineExamPasscode.is_used == True
        ).count()
        total_duration_minutes = round((questions_count * exam.question_duration_seconds) / 60, 1)

        formatted_exams.append({
            "id": exam.id,
            "title": exam.title,
            "description": exam.description,
            "sponsors_and_prizes": exam.sponsors_and_prizes,
            "start_time": exam.start_time.isoformat(),
            "question_duration_seconds": exam.question_duration_seconds,
            "telegram_group_url": exam.telegram_group_url,
            "telegram_submission_minutes": exam.telegram_submission_minutes,
            "questions_count": questions_count,
            "total_duration_minutes": total_duration_minutes,
            "is_active": exam.is_active,
            "available_passcodes_count": passcodes_count - used_passcodes_count
        })

    primary = formatted_exams[0] if formatted_exams else {}
    return {
        **primary,
        "exams": formatted_exams,
        "total_active_exams": len(formatted_exams)
    }

@router.post("/verify-passcode")
def verify_passcode_and_start_exam(payload: VerifyPasscodeRequest, db: Session = Depends(get_db)):
    """
    Validates candidate passcode, registers student session,
    and returns full questions for the exam.
    Passcodes are strictly single-use.
    """
    exam = db.query(OnlineExam).filter(OnlineExam.id == payload.exam_id).first()
    if not exam or not exam.is_active:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە یان ناچالاکە")

    now = datetime.utcnow()
    # Check if start time has arrived (allow a 2-minute clock skew buffer)
    time_diff = (exam.start_time - now).total_seconds()
    if time_diff > 120:
        mins_remaining = int(time_diff / 60) + 1
        raise HTTPException(
            status_code=400,
            detail=f"وادەی دەستپێکردنی ئەم تاقیکردنەوەیە ماوە! نزیکەی {mins_remaining} خولەکی تر دەستپێدەکات."
        )

    clean_code = payload.code.strip().upper()
    passcode = db.query(OnlineExamPasscode).filter(
        OnlineExamPasscode.exam_id == exam.id,
        OnlineExamPasscode.code == clean_code
    ).first()

    if not passcode:
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

    # Consume passcode
    passcode.is_used = True
    passcode.used_at = now
    passcode.student_name = payload.student_name.strip()
    passcode.student_phone = payload.student_phone.strip() if payload.student_phone else None
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
        "exam": {
            "id": exam.id,
            "title": exam.title,
            "question_duration_seconds": exam.question_duration_seconds,
            "telegram_group_url": exam.telegram_group_url,
            "telegram_submission_minutes": exam.telegram_submission_minutes,
            "total_questions": len(questions),
            "questions": [
                {
                    "order_num": q.order_num,
                    "question_text": q.question_text,
                    "image_url": q.image_url
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
    passcode = db.query(OnlineExamPasscode).filter(
        OnlineExamPasscode.exam_id == payload.exam_id,
        OnlineExamPasscode.code == clean_code
    ).first()

    if passcode:
        passcode.disqualified = True
        passcode.disqualification_reason = payload.reason or "بەجێهێشتنی پەڕەی تاقیکردنەوە یان گۆڕینی تاب"
        db.commit()

    return {
        "disqualified": True,
        "message_ku": "ببورە بەهۆی غەشکردن لە تاقیکردنەوە دەرکرای"
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
            "start_time": exam.start_time.isoformat(),
            "question_duration_seconds": exam.question_duration_seconds,
            "telegram_group_url": exam.telegram_group_url,
            "telegram_submission_minutes": exam.telegram_submission_minutes,
            "is_active": exam.is_active,
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
        start_time=payload.start_time,
        question_duration_seconds=payload.question_duration_seconds,
        telegram_group_url=payload.telegram_group_url,
        telegram_submission_minutes=payload.telegram_submission_minutes,
        is_active=payload.is_active
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return {"message": "تاقیکردنەوە بە سەرکەوتوویی دروستکرا", "exam_id": exam.id}

@router.put("/admin/exams/{exam_id}")
def admin_update_exam(
    exam_id: int,
    payload: ExamCreateOrUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN"]))
):
    """Admin updates existing online exam metadata."""
    exam = db.query(OnlineExam).filter(OnlineExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")

    exam.title = payload.title
    exam.description = payload.description
    exam.sponsors_and_prizes = payload.sponsors_and_prizes
    exam.start_time = payload.start_time
    exam.question_duration_seconds = payload.question_duration_seconds
    exam.telegram_group_url = payload.telegram_group_url
    exam.telegram_submission_minutes = payload.telegram_submission_minutes
    exam.is_active = payload.is_active

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
            "image_url": q.image_url
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
            image_url=q_data.image_url
        )
        db.add(new_q)

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
