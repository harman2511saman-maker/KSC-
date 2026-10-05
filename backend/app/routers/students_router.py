"""
Students Management Router.
Handles Student CRUD, Bulk CSV/Excel Import, and filtering.
"""

import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.database import get_db
from app.models import Student, SchoolClass, User
from app.schemas import StudentCreate, StudentOut
from app.auth import get_current_user
from app.crud import log_audit

router = APIRouter(prefix="/api/students", tags=["Students"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[StudentOut])
def list_students(
    search: Optional[str] = None,
    class_id: Optional[int] = None,
    grade: Optional[str] = None,
    limit: int = 200,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Student)
    if class_id:
        query = query.filter(Student.class_id == class_id)
    if grade:
        query = query.filter(Student.grade == grade)
    if search:
        s_clean = f"%{search}%"
        query = query.filter(
            or_(
                Student.name.like(s_clean),
                Student.student_id.like(s_clean),
                Student.qr_identifier.like(s_clean)
            )
        )
    
    students = query.order_by(Student.student_id).offset(offset).limit(limit).all()
    
    # Enrich with class name
    results = []
    for s in students:
        s_out = StudentOut.from_orm(s)
        s_out.class_name = s.school_class.name if s.school_class else None
        results.append(s_out)
    return results

@router.get("/{student_id_or_code}")
def get_student(student_id_or_code: str, db: Session = Depends(get_db)):
    student = None
    if student_id_or_code.isdigit():
        student = db.query(Student).filter(Student.id == int(student_id_or_code)).first()
    if not student:
        student = db.query(Student).filter(Student.student_id == student_id_or_code).first()
    if not student:
        raise HTTPException(status_code=404, detail="قوتابی نەدۆزرایەوە")
    
    s_out = StudentOut.from_orm(student)
    s_out.class_name = student.school_class.name if student.school_class else None
    return s_out

@router.post("/", response_model=StudentOut)
def create_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check duplicate student_id
    existing = db.query(Student).filter(Student.student_id == data.student_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"کۆدی قوتابی '{data.student_id}' پێشتر تۆمارکراوە"
        )

    student = Student(
        student_id=data.student_id,
        name=data.name,
        grade=data.grade,
        class_id=data.class_id,
        academic_year=data.academic_year or "2025 - 2026",
        qr_identifier=data.qr_identifier or f"QR-{data.student_id}",
        status=data.status or "ACTIVE"
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    log_audit(db, "STUDENT_CREATED", "Student", str(student.id), current_user, {"name": data.name})
    
    s_out = StudentOut.from_orm(student)
    s_out.class_name = student.school_class.name if student.school_class else None
    return s_out

@router.put("/{student_id}", response_model=StudentOut)
def update_student(
    student_id: int,
    data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="قوتابی نەدۆزرایەوە")

    student.name = data.name
    student.student_id = data.student_id
    student.grade = data.grade
    student.class_id = data.class_id
    student.academic_year = data.academic_year or student.academic_year
    student.status = data.status or student.status
    
    db.commit()
    db.refresh(student)
    log_audit(db, "STUDENT_UPDATED", "Student", str(student.id), current_user)
    
    s_out = StudentOut.from_orm(student)
    s_out.class_name = student.school_class.name if student.school_class else None
    return s_out

@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="قوتابی نەدۆزرایەوە")
    
    db.delete(student)
    db.commit()
    log_audit(db, "STUDENT_DELETED", "Student", str(student_id), current_user)
    return {"message": "قوتابییەکە بە سەرکەوتوویی سڕایەوە"}

@router.post("/import-bulk")
async def import_students_bulk(
    file: UploadFile = File(...),
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Imports students from CSV or Excel file."""
    content = await file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="تکایە تەنها فایلی CSV یان Excel باربکە")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"هەڵە لە خوێندنەوەی فایل: {str(e)}")

    # Map standard columns (Kurdish / English headers)
    # Expected: student_id / کۆد , name / ناو , grade / پۆل
    imported_count = 0
    skipped_count = 0

    for _, row in df.iterrows():
        sid = str(row.get("student_id") or row.get("کۆد") or row.get("Code") or "").strip()
        name = str(row.get("name") or row.get("ناو") or row.get("Name") or "").strip()
        grade = str(row.get("grade") or row.get("پۆل") or row.get("Grade") or "پۆلی ١٢").strip()
        
        if not sid or not name or sid == "nan" or name == "nan":
            skipped_count += 1
            continue

        existing = db.query(Student).filter(Student.student_id == sid).first()
        if existing:
            # Update name/grade
            existing.name = name
            existing.grade = grade
            if class_id:
                existing.class_id = class_id
        else:
            new_student = Student(
                student_id=sid,
                name=name,
                grade=grade,
                class_id=class_id,
                academic_year="2025 - 2026",
                qr_identifier=f"QR-{sid}"
            )
            db.add(new_student)
            imported_count += 1

    db.commit()
    log_audit(db, "STUDENTS_BULK_IMPORTED", "Student", None, current_user, {"count": imported_count})
    return {
        "message": f"بە سەرکەوتوویی {imported_count} قوتابی نوێ تۆمارکرا",
        "imported_count": imported_count,
        "skipped_count": skipped_count
    }
