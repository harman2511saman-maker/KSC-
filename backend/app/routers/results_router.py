"""
Results and Examination Analytics Router.
Searchable, filterable, and sortable examination results with dashboard analytics.
"""

from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from typing import List, Optional, Dict, Any

from app.database import get_db
from app.models import Result, Exam, Student, SchoolClass, ScanPage, DetectedAnswer, ScanJob, User
from app.schemas import ResultOut, DetectedAnswerOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/results", tags=["Results"], dependencies=[Depends(get_current_user)])

@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Computes real-time statistics for the main Kurdish dashboard."""
    total_students = db.query(Student).count()
    total_exams = db.query(Exam).count()
    
    # Sheets processed today
    today_start = datetime.combine(date.today(), datetime.min.time())
    sheets_today = db.query(ScanPage).filter(ScanPage.created_at >= today_start).count()
    
    # Pending review
    pending_review = db.query(Result).filter(Result.status == "NEEDS_REVIEW").count()
    
    # Average score across all completed results
    avg_score_row = db.query(func.avg(Result.percentage)).filter(Result.status != "NEEDS_REVIEW").scalar()
    avg_score = round(float(avg_score_row), 1) if avg_score_row is not None else 0.0

    # Total passed / failed
    passed_count = db.query(Result).filter(Result.status == "PASSED").count()
    failed_count = db.query(Result).filter(Result.status == "FAILED").count()

    # Recent exams
    recent_exams = db.query(Exam).order_by(desc(Exam.created_at)).limit(5).all()
    recent_exams_data = []
    for ex in recent_exams:
        res_count = db.query(Result).filter(Result.exam_id == ex.id).count()
        recent_exams_data.append({
            "id": ex.id,
            "name": ex.exam_name,
            "subject": ex.subject,
            "grade": ex.grade,
            "status": ex.status,
            "results_count": res_count,
            "created_at": ex.created_at
        })

    # Recent scanning jobs
    recent_jobs = db.query(ScanJob).order_by(desc(ScanJob.created_at)).limit(5).all()
    recent_jobs_data = []
    for j in recent_jobs:
        recent_jobs_data.append({
            "id": j.id,
            "total_pages": j.total_pages,
            "processed_pages": j.processed_pages,
            "status": j.status,
            "created_at": j.created_at
        })

    return {
        "total_students": total_students,
        "total_exams": total_exams,
        "sheets_today": sheets_today,
        "pending_review": pending_review,
        "avg_score": avg_score,
        "passed_count": passed_count,
        "failed_count": failed_count,
        "recent_exams": recent_exams_data,
        "recent_jobs": recent_jobs_data
    }

@router.get("/", response_model=List[ResultOut])
def list_results(
    exam_id: Optional[int] = None,
    class_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Result).join(Result.exam).outerjoin(Result.student)

    if exam_id:
        query = query.filter(Result.exam_id == exam_id)
    if status_filter:
        query = query.filter(Result.status == status_filter)
    if class_id:
        query = query.filter(Student.class_id == class_id)
    if search:
        s_clean = f"%{search}%"
        query = query.filter(
            or_(
                Student.name.like(s_clean),
                Student.student_id.like(s_clean),
                Exam.exam_name.like(s_clean)
            )
        )

    results = query.order_by(desc(Result.created_at)).offset(offset).limit(limit).all()

    items = []
    for r in results:
        scan_page = r.scan_page
        item = ResultOut(
            id=r.id,
            page_id=r.page_id,
            exam_id=r.exam_id,
            exam_name=r.exam.exam_name if r.exam else None,
            student_id=r.student_id,
            student_code=r.student.student_id if r.student else None,
            student_name=r.student.name if r.student else None,
            class_name=r.student.school_class.name if r.student and r.student.school_class else None,
            total_score=r.total_score,
            max_score=r.max_score,
            percentage=r.percentage,
            correct_count=r.correct_count,
            incorrect_count=r.incorrect_count,
            blank_count=r.blank_count,
            multiple_count=r.multiple_count,
            uncertain_count=r.uncertain_count,
            status=r.status,
            created_at=r.created_at,
            normalized_file=scan_page.normalized_file if scan_page else None,
            debug_file=scan_page.debug_file if scan_page else None
        )
        items.append(item)

    return items

@router.get("/{result_id}", response_model=ResultOut)
def get_result_detail(result_id: int, db: Session = Depends(get_db)):
    r = db.query(Result).filter(Result.id == result_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="ئەنجام نەدۆزرایەوە")

    scan_page = r.scan_page
    answers = db.query(DetectedAnswer).filter(
        DetectedAnswer.page_id == r.page_id
    ).order_by(DetectedAnswer.question_num).all()

    # Load correct answer key map
    answer_key_map = {}
    if r.exam:
        for q in r.exam.questions:
            answer_key_map[q.question_num] = q.correct_answer

    answer_items = []
    for a in answers:
        correct_ans = answer_key_map.get(a.question_num)
        eval_status = "UNKNOWN"
        if correct_ans:
            if a.machine_status == "MULTIPLE":
                eval_status = "MULTIPLE"
            elif a.final_answer == correct_ans:
                eval_status = "CORRECT"
            elif a.final_answer is None or a.final_answer == "" or a.machine_status == "BLANK":
                eval_status = "BLANK"
            else:
                eval_status = "INCORRECT"

        answer_items.append(DetectedAnswerOut(
            id=a.id,
            question_num=a.question_num,
            machine_answer=a.machine_answer,
            correct_answer=correct_ans,
            machine_status=a.machine_status,
            eval_status=eval_status,
            confidence=a.confidence,
            final_answer=a.final_answer,
            review_status=a.review_status,
            crop_image_path=a.crop_image_path
        ))

    item = ResultOut(
        id=r.id,
        page_id=r.page_id,
        exam_id=r.exam_id,
        exam_name=r.exam.exam_name if r.exam else None,
        student_id=r.student_id,
        student_code=r.student.student_id if r.student else None,
        student_name=r.student.name if r.student else None,
        class_name=r.student.school_class.name if r.student and r.student.school_class else None,
        total_score=r.total_score,
        max_score=r.max_score,
        percentage=r.percentage,
        correct_count=r.correct_count,
        incorrect_count=r.incorrect_count,
        blank_count=r.blank_count,
        multiple_count=r.multiple_count,
        uncertain_count=r.uncertain_count,
        status=r.status,
        created_at=r.created_at,
        normalized_file=scan_page.normalized_file if scan_page else None,
        debug_file=scan_page.debug_file if scan_page else None,
        answers=answer_items
    )
    return item

@router.delete("/{result_id}")
def delete_result(result_id: int, db: Session = Depends(get_db)):
    """Deletes an examination result and its associated scan page data."""
    r = db.query(Result).filter(Result.id == result_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="ئەنجام نەدۆزرایەوە")

    page_id = r.page_id
    db.delete(r)
    
    if page_id:
        page = db.query(ScanPage).filter(ScanPage.id == page_id).first()
        if page:
            db.delete(page)

    db.commit()
    return {"success": True, "message_ku": "ئەنجامەکە بە سەرکەوتوویی سڕایەوە"}

@router.delete("/")
def delete_bulk_results(
    exam_id: Optional[int] = None,
    result_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    """Deletes multiple results or all results for an exam."""
    query = db.query(Result)
    if result_ids:
        query = query.filter(Result.id.in_(result_ids))
    elif exam_id:
        query = query.filter(Result.exam_id == exam_id)
    else:
        # Delete all results
        pass

    results_to_delete = query.all()
    count = len(results_to_delete)
    page_ids = [r.page_id for r in results_to_delete if r.page_id]

    for r in results_to_delete:
        db.delete(r)

    if page_ids:
        pages = db.query(ScanPage).filter(ScanPage.id.in_(page_ids)).all()
        for p in pages:
            db.delete(p)

    db.commit()
    return {"success": True, "deleted_count": count, "message_ku": f"{count} ئەنجام سڕانەوە"}

