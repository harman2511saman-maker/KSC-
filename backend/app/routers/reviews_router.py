"""
Manual Review Router.
Allows reviewers and teachers to inspect flagged uncertain/multiple answers,
view cropped question row snippets, and apply audited corrections with auto-recalculated scores.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import (
    ScanPage, DetectedAnswer, Result, Exam, Student,
    ExamQuestion, ManualReview, User
)
from app.schemas import ManualReviewSubmit
from app.auth import get_current_user
from app.crud import log_audit

router = APIRouter(prefix="/api/reviews", tags=["Manual Review"], dependencies=[Depends(get_current_user)])

@router.get("/pending")
def list_pending_reviews(
    exam_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Lists all scanned sheets currently requiring human review."""
    query = db.query(Result).filter(Result.status == "NEEDS_REVIEW")
    if exam_id:
        query = query.filter(Result.exam_id == exam_id)
    
    results = query.order_by(Result.created_at.desc()).limit(limit).all()

    items = []
    for r in results:
        scan_page = r.scan_page
        exam = r.exam
        student = r.student

        # Count questions needing review
        uncertain_q_count = db.query(DetectedAnswer).filter(
            DetectedAnswer.page_id == r.page_id,
            DetectedAnswer.machine_status.in_(["UNCERTAIN", "MULTIPLE"]),
            DetectedAnswer.review_status == "NEEDS_REVIEW"
        ).count()

        items.append({
            "result_id": r.id,
            "page_id": r.page_id,
            "exam_id": r.exam_id,
            "exam_name": exam.exam_name if exam else "نادیار",
            "student_id": student.id if student else None,
            "student_code": student.student_id if student else "نادیار",
            "student_name": student.name if student else "نادیار",
            "total_score": r.total_score,
            "max_score": r.max_score,
            "percentage": r.percentage,
            "uncertain_count": r.uncertain_count,
            "multiple_count": r.multiple_count,
            "pending_questions_count": uncertain_q_count,
            "normalized_file": scan_page.normalized_file if scan_page else None,
            "debug_file": scan_page.debug_file if scan_page else None,
            "created_at": r.created_at
        })

    return items

@router.get("/page-details/{page_id}")
def get_page_review_details(page_id: int, db: Session = Depends(get_db)):
    """Retrieves full details of a page including all question answers and cropped row images."""
    scan_page = db.query(ScanPage).filter(ScanPage.id == page_id).first()
    if not scan_page:
        raise HTTPException(status_code=404, detail="پەڕەکە نەدۆزرایەوە")

    result = scan_page.result
    exam = result.exam if result else None
    student = result.student if result else None

    # Load correct answer key map
    answer_key_map = {}
    marks_map = {}
    if exam:
        for q in exam.questions:
            answer_key_map[q.question_num] = q.correct_answer
            marks_map[q.question_num] = q.marks

    answers = db.query(DetectedAnswer).filter(
        DetectedAnswer.page_id == page_id
    ).order_by(DetectedAnswer.question_num).all()

    question_items = []
    for a in answers:
        correct_ans = answer_key_map.get(a.question_num)
        mark_val = marks_map.get(a.question_num, 1.0)
        
        # Calculate current eval status based on final_answer
        eval_status = "UNKNOWN"
        is_correct = False
        if correct_ans:
            if a.final_answer == correct_ans:
                eval_status = "CORRECT"
                is_correct = True
            elif a.final_answer is None or a.final_answer == "":
                eval_status = "BLANK"
            else:
                eval_status = "INCORRECT"

        question_items.append({
            "id": a.id,
            "question_num": a.question_num,
            "machine_answer": a.machine_answer,
            "machine_status": a.machine_status,
            "confidence": a.confidence,
            "final_answer": a.final_answer,
            "correct_answer": correct_ans,
            "eval_status": eval_status,
            "is_correct": is_correct,
            "mark_value": mark_val,
            "review_status": a.review_status,
            "reviewed_by": a.reviewed_by,
            "reviewed_at": a.reviewed_at,
            "crop_image_path": a.crop_image_path
        })

    return {
        "page_id": scan_page.id,
        "job_id": scan_page.job_id,
        "result_id": result.id if result else None,
        "exam_id": exam.id if exam else None,
        "exam_name": exam.exam_name if exam else None,
        "choices": [c.strip() for c in exam.choices.split(",")] if exam else ["A", "B", "C", "D"],
        "student_id": student.id if student else None,
        "student_name": student.name if student else None,
        "student_code": student.student_id if student else None,
        "normalized_file": scan_page.normalized_file,
        "debug_file": scan_page.debug_file,
        "total_score": result.total_score if result else 0.0,
        "percentage": result.percentage if result else 0.0,
        "status": result.status if result else scan_page.status,
        "questions": question_items
    }

@router.post("/submit")
def submit_manual_review(
    payload: ManualReviewSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Applies manual teacher corrections to questions on a page,
    records manual review audit trail, and automatically recalculates final scores.
    """
    scan_page = db.query(ScanPage).filter(ScanPage.id == payload.page_id).first()
    if not scan_page:
        raise HTTPException(status_code=404, detail="پەڕەکە نەدۆزرایەوە")

    result = scan_page.result
    if not result:
        raise HTTPException(status_code=400, detail="ئەم پەڕەیە ئەنجامی سەرەکی نییە")

    exam = result.exam
    answer_key_map = {}
    marks_map = {}
    ungraded_set = set()
    if exam:
        for q in exam.questions:
            answer_key_map[q.question_num] = q.correct_answer
            marks_map[q.question_num] = q.marks
            if q.is_ungraded:
                ungraded_set.add(q.question_num)

    # Apply reviews to DetectedAnswers
    for rev in payload.reviews:
        det_ans = db.query(DetectedAnswer).filter(
            DetectedAnswer.page_id == payload.page_id,
            DetectedAnswer.question_num == rev.question_num
        ).first()

        if det_ans:
            old_val = det_ans.final_answer
            new_val = rev.reviewed_answer

            # Record ManualReview audit
            db.add(ManualReview(
                page_id=payload.page_id,
                question_num=rev.question_num,
                original_answer=old_val,
                reviewed_answer=new_val,
                reviewer_id=current_user.id if current_user else None,
                reviewer_name=current_user.full_name_ku if current_user else "مامۆستا",
                notes=rev.notes
            ))

            det_ans.final_answer = new_val
            det_ans.review_status = "REVIEWED_CORRECTED" if new_val != det_ans.machine_answer else "REVIEWED_CONFIRMED"
            det_ans.reviewed_by = current_user.full_name_ku if current_user else "مامۆستا"
            det_ans.reviewed_at = datetime.utcnow()

    db.commit()

    # Recalculate Overall Score Server-Side
    all_answers = db.query(DetectedAnswer).filter(
        DetectedAnswer.page_id == payload.page_id
    ).all()

    correct_c = 0
    incorrect_c = 0
    blank_c = 0
    total_score = 0.0
    max_possible_score = 0.0

    for a in all_answers:
        q_num = a.question_num
        if q_num in ungraded_set:
            continue

        correct_ans = answer_key_map.get(q_num)
        mark_val = marks_map.get(q_num, 1.0)
        max_possible_score += mark_val

        if a.final_answer == correct_ans and correct_ans is not None:
            correct_c += 1
            total_score += mark_val
        elif a.final_answer is None or a.final_answer == "":
            blank_c += 1
        else:
            incorrect_c += 1

    percentage = round((total_score / max(0.001, max_possible_score)) * 100.0, 2) if max_possible_score > 0 else 0.0
    pass_mark = exam.pass_mark if exam else 50.0

    result.total_score = round(total_score, 2)
    result.max_score = round(max_possible_score, 2)
    result.percentage = percentage
    result.correct_count = correct_c
    result.incorrect_count = incorrect_c
    result.blank_count = blank_c
    result.status = "PASSED" if percentage >= pass_mark else "FAILED"
    result.updated_at = datetime.utcnow()

    scan_page.status = "COMPLETED"
    db.commit()

    log_audit(db, "MANUAL_REVIEW_SUBMITTED", "Result", str(result.id), current_user, {
        "new_score": result.total_score,
        "percentage": percentage
    })

    return {
        "success": True,
        "message_ku": "پێداچوونەوەکە بە سەرکەوتوویی جێبەجێ کرا و نمرەی نوێ هەژمارکرا",
        "result_id": result.id,
        "new_score": result.total_score,
        "percentage": result.percentage,
        "status": result.status
    }
