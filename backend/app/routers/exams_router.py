"""
Exams Management Router.
Handles Exam CRUD, Duplication, Archival, Status validation, and metadata.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional

from app.database import get_db
from app.models import (
    Exam, ExamQuestion, SchoolClass, User, Result,
    GeneratedSheet, ScanPage, DetectedAnswer, ManualReview
)
from app.schemas import ExamCreate, ExamUpdate, ExamOut
from app.auth import get_current_user
from app.crud import log_audit

router = APIRouter(prefix="/api/exams", tags=["Exams"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[ExamOut])
def list_exams(
    status_filter: Optional[str] = None,
    class_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Exam)
    if status_filter:
        query = query.filter(Exam.status == status_filter)
    if class_id:
        query = query.filter(Exam.class_id == class_id)
    
    exams = query.order_by(desc(Exam.created_at)).all()
    results = []
    for ex in exams:
        ex_out = ExamOut.from_orm(ex)
        ex_out.class_name = ex.school_class.name if ex.school_class else None
        
        # Check answer key completion
        q_count = len(ex.questions)
        ex_out.questions_count = q_count
        filled_answers = sum(1 for q in ex.questions if q.correct_answer or q.is_ungraded)
        ex_out.answer_key_completed = (filled_answers >= ex.number_of_questions and ex.number_of_questions > 0)
        results.append(ex_out)
    return results

@router.get("/{exam_id}", response_model=ExamOut)
def get_exam(exam_id: str, db: Session = Depends(get_db)):
    clean_id = int(exam_id.lstrip(':')) if exam_id.lstrip(':').isdigit() else None
    if not clean_id:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")
    ex = db.query(Exam).filter(Exam.id == clean_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")
    
    ex_out = ExamOut.from_orm(ex)
    ex_out.class_name = ex.school_class.name if ex.school_class else None
    q_count = len(ex.questions)
    ex_out.questions_count = q_count
    filled_answers = sum(1 for q in ex.questions if q.correct_answer or q.is_ungraded)
    ex_out.answer_key_completed = (filled_answers >= ex.number_of_questions and ex.number_of_questions > 0)
    return ex_out

@router.post("/", response_model=ExamOut)
def create_exam(
    data: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exam = Exam(
        exam_name=data.exam_name,
        subject=data.subject,
        grade=data.grade,
        class_id=data.class_id,
        academic_year=data.academic_year or "2025 - 2026",
        exam_date=data.exam_date,
        number_of_questions=data.number_of_questions or 50,
        choices=data.choices or "A,B,C,D",
        total_marks=data.total_marks or 100.0,
        pass_mark=data.pass_mark or 50.0,
        instructions=data.instructions,
        status="DRAFT",
        template_version=data.template_version or "OMR-V1"
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    # Initialize empty question slots for answer key
    mark_per_q = round(exam.total_marks / max(1, exam.number_of_questions), 2)
    for q_idx in range(1, exam.number_of_questions + 1):
        db.add(ExamQuestion(
            exam_id=exam.id,
            question_num=q_idx,
            correct_answer=None,
            marks=mark_per_q,
            is_ungraded=False
        ))
    db.commit()

    log_audit(db, "EXAM_CREATED", "Exam", str(exam.id), current_user, {"name": exam.exam_name})
    
    ex_out = ExamOut.from_orm(exam)
    ex_out.class_name = exam.school_class.name if exam.school_class else None
    ex_out.questions_count = exam.number_of_questions
    ex_out.answer_key_completed = False
    return ex_out

@router.put("/{exam_id}", response_model=ExamOut)
def update_exam(
    exam_id: int,
    data: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")

    # If status is being set to ACTIVE, validate answer key completeness
    if data.status == "ACTIVE":
        filled_count = db.query(ExamQuestion).filter(
            ExamQuestion.exam_id == exam_id,
            (ExamQuestion.correct_answer.isnot(None)) | (ExamQuestion.is_ungraded == True)
        ).count()
        if filled_count < exam.number_of_questions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"نەتوانرا تاقیکردنەوەکە چالاک بکرێت: کلیلی وەڵام بۆ هەموو {exam.number_of_questions} پرسیارەکە تەواو نەکراوە ({filled_count} دانراوە)"
            )

    for field, val in data.dict(exclude_unset=True).items():
        setattr(exam, field, val)

    db.commit()
    db.refresh(exam)
    log_audit(db, "EXAM_UPDATED", "Exam", str(exam.id), current_user)
    
    ex_out = ExamOut.from_orm(exam)
    ex_out.class_name = exam.school_class.name if exam.school_class else None
    ex_out.questions_count = len(exam.questions)
    filled_answers = sum(1 for q in exam.questions if q.correct_answer or q.is_ungraded)
    ex_out.answer_key_completed = (filled_answers >= exam.number_of_questions)
    return ex_out

@router.post("/{exam_id}/duplicate", response_model=ExamOut)
def duplicate_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    original = db.query(Exam).filter(Exam.id == exam_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")

    new_exam = Exam(
        exam_name=f"{original.exam_name} (کۆپی)",
        subject=original.subject,
        grade=original.grade,
        class_id=original.class_id,
        academic_year=original.academic_year,
        exam_date=original.exam_date,
        number_of_questions=original.number_of_questions,
        choices=original.choices,
        total_marks=original.total_marks,
        pass_mark=original.pass_mark,
        instructions=original.instructions,
        status="DRAFT",
        template_version=original.template_version
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)

    # Copy questions and answer key
    for q in original.questions:
        db.add(ExamQuestion(
            exam_id=new_exam.id,
            question_num=q.question_num,
            correct_answer=q.correct_answer,
            marks=q.marks,
            is_ungraded=q.is_ungraded
        ))
    db.commit()

    log_audit(db, "EXAM_DUPLICATED", "Exam", str(new_exam.id), current_user, {"original_id": exam_id})
    
    ex_out = ExamOut.from_orm(new_exam)
    ex_out.class_name = new_exam.school_class.name if new_exam.school_class else None
    return ex_out

@router.delete("/{exam_id}")
def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")

    # Cascade delete all related results, scan pages, and reviews cleanly
    results = db.query(Result).filter(Result.exam_id == exam_id).all()
    page_ids = [r.page_id for r in results if r.page_id]
    
    db.query(Result).filter(Result.exam_id == exam_id).delete(synchronize_session=False)
    
    if page_ids:
        db.query(DetectedAnswer).filter(DetectedAnswer.page_id.in_(page_ids)).delete(synchronize_session=False)
        db.query(ManualReview).filter(ManualReview.page_id.in_(page_ids)).delete(synchronize_session=False)
        db.query(ScanPage).filter(ScanPage.id.in_(page_ids)).delete(synchronize_session=False)
        
    db.query(GeneratedSheet).filter(GeneratedSheet.exam_id == exam_id).delete(synchronize_session=False)
    db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).delete(synchronize_session=False)

    db.delete(exam)
    db.commit()
    log_audit(db, "EXAM_DELETED", "Exam", str(exam_id), current_user)
    return {"message": "تاقیکردنەوەکە و سەرجەم داتاکانی بە سەرکەوتوویی سڕانەوە"}
