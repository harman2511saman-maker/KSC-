"""
OMR Answer Sheet Generator Router.
Generates deterministic A4 OMR sheets (PDF & High-Res PNG) with QR codes,
registration markers, and Kurdish exam headers for printing and distribution.
"""

import io
import uuid
import zipfile
from fastapi import APIRouter, Depends, HTTPException, Response, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.models import Exam, Student, SchoolClass, GeneratedSheet, User
from app.auth import get_current_user
from app.omr.sheet_generator import generate_omr_sheet_pdf, generate_omr_sheet_image
from app.config import UPLOADS_SHEETS_DIR

router = APIRouter(prefix="/api/sheets", tags=["Sheets Generator"])

@router.get("/preview-image/{exam_id}")
def preview_sheet_image(
    exam_id: str,
    student_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns high-resolution PNG image preview of the deterministic OMR sheet."""
    raw_id = str(exam_id).split('&')[0].split('?')[0].lstrip(':')
    clean_id = int(raw_id) if raw_id.isdigit() else None
    if not clean_id:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")
    exam = db.query(Exam).filter(Exam.id == clean_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")

    student = None
    if student_id:
        raw_sid = str(student_id).split('&')[0].split('?')[0].lstrip(':')
        clean_sid = int(raw_sid) if raw_sid.isdigit() else None
        if clean_sid:
            student = db.query(Student).filter(Student.id == clean_sid).first()

    # Determine school name with priority: Student School > Exam School > Default School
    school_name = ""
    if student and student.school_class:
        school_name = student.school_class.name
    elif exam.school_class:
        school_name = exam.school_class.name
    else:
        first_school = db.query(SchoolClass).first()
        if first_school:
            school_name = first_school.name

    exam_dict = {
        "id": exam.id,
        "exam_name": exam.exam_name,
        "subject": exam.subject,
        "grade": exam.grade,
        "school_name": school_name,
        "class_name": school_name,
        "academic_year": exam.academic_year,
        "number_of_questions": exam.number_of_questions,
        "choices": [c.strip() for c in exam.choices.split(",")],
        "template_version": exam.template_version
    }

    student_dict = {
        "id": student.id,
        "name": student.name,
        "student_id": student.student_id,
        "school_name": school_name,
        "class_name": school_name
    } if student else None

    sheet_img = generate_omr_sheet_image(
        exam_data=exam_dict,
        student_data=student_dict,
        sheet_id=f"PREVIEW-EX{exam_id}"
    )

    buf = io.BytesIO()
    sheet_img.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type="image/png")

@router.get("/download-pdf/{exam_id}")
def download_sheet_pdf(
    exam_id: str,
    student_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Generates and downloads standard printable A4 PDF answer sheet."""
    clean_id = int(str(exam_id).lstrip(':')) if str(exam_id).lstrip(':').isdigit() else None
    if not clean_id:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")
    exam = db.query(Exam).filter(Exam.id == clean_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")

    student = None
    if student_id:
        clean_sid = int(str(student_id).lstrip(':')) if str(student_id).lstrip(':').isdigit() else None
        if clean_sid:
            student = db.query(Student).filter(Student.id == clean_sid).first()

    school_name = ""
    if student and student.school_class:
        school_name = student.school_class.name
    elif exam.school_class:
        school_name = exam.school_class.name
    else:
        first_school = db.query(SchoolClass).first()
        if first_school:
            school_name = first_school.name

    exam_dict = {
        "id": exam.id,
        "exam_name": exam.exam_name,
        "subject": exam.subject,
        "grade": exam.grade,
        "school_name": school_name,
        "class_name": school_name,
        "academic_year": exam.academic_year,
        "number_of_questions": exam.number_of_questions,
        "choices": [c.strip() for c in exam.choices.split(",")],
        "template_version": exam.template_version
    }

    student_dict = {
        "id": student.id,
        "name": student.name,
        "student_id": student.student_id,
        "school_name": school_name,
        "class_name": school_name
    } if student else None

    sheet_code = f"OMR-EX{clean_id}-STD{student.student_id if student else 'BLANK'}"
    pdf_bytes = generate_omr_sheet_pdf(
        exam_data=exam_dict,
        student_data=student_dict,
        sheet_id=sheet_code
    )

    filename = f"omr_sheet_{exam.id}_{student.student_id if student else 'blank'}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )

@router.get("/generate-batch-pdf/{exam_id}")
def generate_class_batch_pdf(
    exam_id: str,
    class_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Generates a consolidated multi-page A4 PDF containing customized OMR sheets
    for all students in the school/exam.
    """
    clean_id = int(str(exam_id).lstrip(':')) if str(exam_id).lstrip(':').isdigit() else None
    if not clean_id:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")
    exam = db.query(Exam).filter(Exam.id == clean_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")

    clean_cid = int(str(class_id).lstrip(':')) if class_id and str(class_id).lstrip(':').isdigit() else None
    target_class_id = clean_cid or exam.class_id
    query = db.query(Student)
    if target_class_id:
        query = query.filter(Student.class_id == target_class_id)
    students = query.order_by(Student.student_id).all()

    if not students:
        raise HTTPException(status_code=400, detail="هیچ قوتابییەک نەدۆزرایەوە بۆ دروستکردنی پەڕەی وەڵام")

    # Generate multi-page PDF using pypdf writer
    from pypdf import PdfWriter, PdfReader
    writer = PdfWriter()

    for s in students:
        school_name = s.school_class.name if s.school_class else (exam.school_class.name if exam.school_class else "")
        if not school_name:
            first_school = db.query(SchoolClass).first()
            if first_school:
                school_name = first_school.name

        exam_dict = {
            "id": exam.id,
            "exam_name": exam.exam_name,
            "subject": exam.subject,
            "grade": exam.grade,
            "school_name": school_name,
            "class_name": school_name,
            "academic_year": exam.academic_year,
            "number_of_questions": exam.number_of_questions,
            "choices": [c.strip() for c in exam.choices.split(",")],
            "template_version": exam.template_version
        }
        s_dict = {
            "id": s.id,
            "name": s.name,
            "student_id": s.student_id,
            "school_name": school_name,
            "class_name": school_name
        }
        sheet_code = f"OMR-EX{exam.id}-STD{s.student_id}"
        single_pdf_bytes = generate_omr_sheet_pdf(
            exam_data=exam_dict,
            student_data=s_dict,
            sheet_id=sheet_code
        )
        reader = PdfReader(io.BytesIO(single_pdf_bytes))
        for page in reader.pages:
            writer.add_page(page)

    output_buffer = io.BytesIO()
    writer.write(output_buffer)
    output_buffer.seek(0)

    filename = f"omr_batch_exam_{exam.id}.pdf"
    return StreamingResponse(
        output_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
