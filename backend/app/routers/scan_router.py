"""
Scanning and OMR Processing Router.
Handles mobile camera uploads, single/batch image processing,
multi-page PDF streaming batch extraction, and job progress tracking.
"""

import io
import os
import uuid
import json
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from app.database import get_db, SessionLocal
from app.models import (
    Exam, Student, ScanJob, ScanPage, DetectedAnswer,
    Result, OMRCalibration, User
)
from app.auth import get_current_user
from app.omr.omr_pipeline import process_omr_sheet, regrade_pipeline_results
from app.omr.pdf_processor import extract_images_from_pdf, get_pdf_page_count
from app.config import DEFAULT_CALIBRATION, UPLOADS_ORIGINAL_DIR
from app.crud import log_audit

router = APIRouter(prefix="/api/scan", tags=["Scanning"], dependencies=[Depends(get_current_user)])

def get_active_calibration(db: Session) -> Dict[str, Any]:
    calib = db.query(OMRCalibration).filter(OMRCalibration.key == "default").first()
    if calib:
        try:
            return json.loads(calib.value_json)
        except Exception:
            pass
    return DEFAULT_CALIBRATION.copy()

def build_exam_context(exam_id: int, db: Session) -> Optional[Dict[str, Any]]:
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        return None

    # Load answer key
    answer_key_dict = {}
    question_marks_dict = {}
    ungraded_questions = []

    for q in exam.questions:
        if q.correct_answer:
            answer_key_dict[q.question_num] = q.correct_answer
        question_marks_dict[q.question_num] = q.marks
        if q.is_ungraded:
            ungraded_questions.append(q.question_num)

    return {
        "exam": exam,
        "exam_data": {
            "id": exam.id,
            "exam_name": exam.exam_name,
            "number_of_questions": exam.number_of_questions,
            "choices": [c.strip() for c in exam.choices.split(",")],
            "pass_mark": exam.pass_mark,
            "total_marks": exam.total_marks,
            "template_version": exam.template_version
        },
        "answer_key_dict": answer_key_dict,
        "question_marks_dict": question_marks_dict,
        "ungraded_questions": ungraded_questions
    }

@router.post("/process-single")
async def process_single_image(
    file: UploadFile = File(...),
    exam_id: Optional[int] = Form(None),
    student_id: Optional[int] = Form(None),
    override_duplicate: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Processes a single photographed or uploaded answer sheet image.
    Performs full CV pipeline, homography, QR decode, answer grading, and result persistence.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="فایلی بەتاڵ بارکراوە")

    calibration_params = get_active_calibration(db)

    # Initial context (if exam_id provided)
    exam_ctx = build_exam_context(exam_id, db) if exam_id else None

    # Run OMR Pipeline in threadpool
    pipeline_res = await asyncio.to_thread(
        process_omr_sheet,
        image_input=contents,
        exam_data=exam_ctx["exam_data"] if exam_ctx else None,
        answer_key_dict=exam_ctx["answer_key_dict"] if exam_ctx else None,
        question_marks_dict=exam_ctx["question_marks_dict"] if exam_ctx else None,
        ungraded_questions=exam_ctx["ungraded_questions"] if exam_ctx else None,
        calibration_params=calibration_params,
        save_artifacts=True
    )

    if not pipeline_res["success"]:
        return {
            "success": False,
            "status_code": pipeline_res["status_code"],
            "message_ku": pipeline_res["message_ku"],
            "quality": pipeline_res.get("quality"),
            "data": None
        }

    # Resolve Exam & Student from QR or Form Fallback
    resolved_exam_id = exam_id or pipeline_res.get("detected_exam_id")
    resolved_student_id = student_id or pipeline_res.get("detected_student_id")

    # If exam detected from QR was different from initial form exam, re-evaluate score with proper key instantly in-memory
    if resolved_exam_id and (not exam_ctx or exam_ctx["exam"].id != resolved_exam_id):
        exam_ctx = build_exam_context(resolved_exam_id, db)
        if exam_ctx:
            pipeline_res = regrade_pipeline_results(
                pipeline_res=pipeline_res,
                exam_data=exam_ctx["exam_data"],
                answer_key_dict=exam_ctx["answer_key_dict"],
                question_marks_dict=exam_ctx["question_marks_dict"],
                ungraded_questions=exam_ctx["ungraded_questions"]
            )

    # Check student existence in database
    student_obj = None
    if resolved_student_id:
        student_obj = db.query(Student).filter(Student.id == resolved_student_id).first()
        if not student_obj and str(resolved_student_id).startswith("STD-"):
            student_obj = db.query(Student).filter(Student.student_id == str(resolved_student_id)).first()

    # Create standalone ScanJob record for audit
    job_id = f"JOB-{str(uuid.uuid4())[:8]}"
    scan_job = ScanJob(
        id=job_id,
        total_pages=1,
        processed_pages=1,
        successful_pages=1 if pipeline_res["overall_status"] == "COMPLETED" else 0,
        needs_review_pages=1 if pipeline_res["overall_status"] == "NEEDS_REVIEW" else 0,
        failed_pages=0,
        status="COMPLETED"
    )
    db.add(scan_job)
    db.commit()

    # Check for Duplicate Result
    is_duplicate = False
    if resolved_exam_id and student_obj:
        existing_res = db.query(Result).filter(
            Result.exam_id == resolved_exam_id,
            Result.student_id == student_obj.id
        ).first()
        if existing_res:
            is_duplicate = True
            if not override_duplicate:
                return {
                    "success": False,
                    "status_code": "DUPLICATE_SHEET",
                    "message_ku": f"ئەم پەڕەیەی قوتابی '{student_obj.name}' پێشتر بۆ ئەم تاقیکردنەوەیە تۆمارکراوە.",
                    "existing_result_id": existing_res.id,
                    "data": pipeline_res
                }

    # Save ScanPage
    scan_page = ScanPage(
        job_id=scan_job.id,
        page_index=1,
        original_file=pipeline_res["original_image_path"],
        normalized_file=pipeline_res["normalized_image_path"],
        debug_file=pipeline_res["debug_image_path"],
        status=pipeline_res["overall_status"],
        confidence_score=pipeline_res["summary"]["average_confidence"],
        qr_data_json=json.dumps({"sheet_id": pipeline_res["sheet_id"], "exam_id": resolved_exam_id, "student_id": resolved_student_id})
    )
    db.add(scan_page)
    db.commit()
    db.refresh(scan_page)

    # Save Detected Answers
    for a in pipeline_res["answers"]:
        db.add(DetectedAnswer(
            page_id=scan_page.id,
            question_num=a["question_num"],
            machine_answer=a["machine_answer"],
            machine_status=a["machine_status"],
            confidence=a["confidence"],
            final_answer=a["final_answer"],
            review_status=a["review_status"],
            crop_image_path=a.get("row_crop_path")
        ))
    db.commit()

    # Save Result if Exam is identified
    saved_result_id = None
    if resolved_exam_id:
        result_status = "PASSED" if pipeline_res["summary"]["passed"] else "FAILED"
        if pipeline_res["overall_status"] == "NEEDS_REVIEW":
            result_status = "NEEDS_REVIEW"

        result_obj = Result(
            page_id=scan_page.id,
            exam_id=resolved_exam_id,
            student_id=student_obj.id if student_obj else None,
            total_score=pipeline_res["summary"]["total_score"],
            max_score=pipeline_res["summary"]["max_possible_score"],
            percentage=pipeline_res["summary"]["percentage"],
            correct_count=pipeline_res["summary"]["correct_count"],
            incorrect_count=pipeline_res["summary"]["incorrect_count"],
            blank_count=pipeline_res["summary"]["blank_count"],
            multiple_count=pipeline_res["summary"]["multiple_count"],
            uncertain_count=pipeline_res["summary"]["uncertain_count"],
            status=result_status
        )
        db.add(result_obj)
        db.commit()
        db.refresh(result_obj)
        saved_result_id = result_obj.id

    log_audit(db, "SCAN_PROCESSED", "ScanPage", str(scan_page.id), current_user, {
        "exam_id": resolved_exam_id,
        "student_id": student_obj.id if student_obj else None,
        "status": pipeline_res["overall_status"]
    })

    return {
        "success": True,
        "status_code": "PROCESSED_SUCCESS",
        "message_ku": "پەڕەکە بە سەرکەوتوویی خوێندرایەوە و تۆمارکرا",
        "page_id": scan_page.id,
        "job_id": scan_job.id,
        "result_id": saved_result_id,
        "is_duplicate_warning": is_duplicate,
        "resolved_student": {
            "id": student_obj.id,
            "name": student_obj.name,
            "student_id": student_obj.student_id
        } if student_obj else None,
        "data": pipeline_res
    }

def run_batch_pdf_worker(job_id: str, pdf_bytes: bytes, exam_id: Optional[int]):
    """Background asynchronous task to process multi-page PDF files page-by-page."""
    db = SessionLocal()
    try:
        job = db.query(ScanJob).filter(ScanJob.id == job_id).first()
        if not job:
            return

        job.status = "PROCESSING"
        db.commit()

        calibration_params = get_active_calibration(db)
        exam_ctx = build_exam_context(exam_id, db) if exam_id else None

        for page_idx, page_bgr in extract_images_from_pdf(pdf_bytes, target_dpi=200):
            try:
                pipeline_res = process_omr_sheet(
                    image_input=page_bgr,
                    exam_data=exam_ctx["exam_data"] if exam_ctx else None,
                    answer_key_dict=exam_ctx["answer_key_dict"] if exam_ctx else None,
                    question_marks_dict=exam_ctx["question_marks_dict"] if exam_ctx else None,
                    ungraded_questions=exam_ctx["ungraded_questions"] if exam_ctx else None,
                    calibration_params=calibration_params,
                    save_artifacts=True
                )

                if not pipeline_res["success"]:
                    scan_page = ScanPage(
                        job_id=job.id,
                        page_index=page_idx,
                        original_file=pipeline_res.get("original_image_path"),
                        status="FAILED",
                        failure_reason=pipeline_res.get("message_ku")
                    )
                    db.add(scan_page)
                    job.failed_pages += 1
                else:
                    resolved_exam_id = exam_id or pipeline_res.get("detected_exam_id")
                    resolved_student_id = pipeline_res.get("detected_student_id")

                    # If detected exam differs from default, regrade properly
                    if resolved_exam_id and (not exam_ctx or exam_ctx["exam"].id != resolved_exam_id):
                        cur_exam_ctx = build_exam_context(resolved_exam_id, db)
                        if cur_exam_ctx:
                            pipeline_res = regrade_pipeline_results(
                                pipeline_res=pipeline_res,
                                exam_data=cur_exam_ctx["exam_data"],
                                answer_key_dict=cur_exam_ctx["answer_key_dict"],
                                question_marks_dict=cur_exam_ctx["question_marks_dict"],
                                ungraded_questions=cur_exam_ctx["ungraded_questions"]
                            )

                    student_obj = None
                    if resolved_student_id:
                        student_obj = db.query(Student).filter(Student.id == resolved_student_id).first()
                        if not student_obj:
                            student_obj = db.query(Student).filter(Student.student_id == str(resolved_student_id)).first()

                    scan_page = ScanPage(
                        job_id=job.id,
                        page_index=page_idx,
                        original_file=pipeline_res["original_image_path"],
                        normalized_file=pipeline_res["normalized_image_path"],
                        debug_file=pipeline_res["debug_image_path"],
                        status=pipeline_res["overall_status"],
                        confidence_score=pipeline_res["summary"]["average_confidence"],
                        qr_data_json=json.dumps({"sheet_id": pipeline_res["sheet_id"], "exam_id": resolved_exam_id, "student_id": resolved_student_id})
                    )
                    db.add(scan_page)
                    db.commit()
                    db.refresh(scan_page)

                    for a in pipeline_res["answers"]:
                        db.add(DetectedAnswer(
                            page_id=scan_page.id,
                            question_num=a["question_num"],
                            machine_answer=a["machine_answer"],
                            machine_status=a["machine_status"],
                            confidence=a["confidence"],
                            final_answer=a["final_answer"],
                            review_status=a["review_status"],
                            crop_image_path=a.get("row_crop_path")
                        ))

                    if resolved_exam_id:
                        res_status = "PASSED" if pipeline_res["summary"]["passed"] else "FAILED"
                        if pipeline_res["overall_status"] == "NEEDS_REVIEW":
                            res_status = "NEEDS_REVIEW"

                        db.add(Result(
                            page_id=scan_page.id,
                            exam_id=resolved_exam_id,
                            student_id=student_obj.id if student_obj else None,
                            total_score=pipeline_res["summary"]["total_score"],
                            max_score=pipeline_res["summary"]["max_possible_score"],
                            percentage=pipeline_res["summary"]["percentage"],
                            correct_count=pipeline_res["summary"]["correct_count"],
                            incorrect_count=pipeline_res["summary"]["incorrect_count"],
                            blank_count=pipeline_res["summary"]["blank_count"],
                            multiple_count=pipeline_res["summary"]["multiple_count"],
                            uncertain_count=pipeline_res["summary"]["uncertain_count"],
                            status=res_status
                        ))

                    if pipeline_res["overall_status"] == "COMPLETED":
                        job.successful_pages += 1
                    else:
                        job.needs_review_pages += 1

                job.processed_pages += 1
                db.commit()

            except Exception as e:
                job.failed_pages += 1
                job.processed_pages += 1
                db.commit()

        job.status = "COMPLETED"
        db.commit()

    finally:
        db.close()

@router.post("/batch-pdf")
async def upload_batch_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    exam_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initializes asynchronous multi-page PDF processing batch queue."""
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="فایلی PDF بەتاڵە")

    try:
        total_pages = get_pdf_page_count(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"هەڵە لە خوێندنەوەی PDF: {str(e)}")

    job_id = f"BATCH-{str(uuid.uuid4())[:8]}"
    scan_job = ScanJob(
        id=job_id,
        total_pages=total_pages,
        processed_pages=0,
        successful_pages=0,
        needs_review_pages=0,
        failed_pages=0,
        status="QUEUED"
    )
    db.add(scan_job)
    db.commit()

    # Launch background task
    background_tasks.add_task(run_batch_pdf_worker, job_id, contents, exam_id)
    log_audit(db, "BATCH_SCAN_STARTED", "ScanJob", job_id, current_user, {"total_pages": total_pages, "exam_id": exam_id})

    return {
        "job_id": job_id,
        "total_pages": total_pages,
        "status": "QUEUED",
        "message_ku": f"پڕۆسەی خوێندنەوەی دەستەیی بۆ {total_pages} پەڕە دەستی پێکرد"
    }

@router.get("/job-status/{job_id}")
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ScanJob).filter(ScanJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="کاری سکانکردن نەدۆزرایەوە")

    return {
        "job_id": job.id,
        "total_pages": job.total_pages,
        "processed_pages": job.processed_pages,
        "successful_pages": job.successful_pages,
        "needs_review_pages": job.needs_review_pages,
        "failed_pages": job.failed_pages,
        "status": job.status,
        "is_finished": job.status in ["COMPLETED", "FAILED"],
        "percentage": round((job.processed_pages / max(1, job.total_pages)) * 100.0, 1),
        "created_at": job.created_at,
        "updated_at": job.updated_at
    }
