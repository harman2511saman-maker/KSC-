"""
Schools and Classes Management Router.
Handles School CRUD and Student Associations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import SchoolClass, Student, User
from app.schemas import ClassCreate, ClassUpdate, ClassOut
from app.auth import get_current_user
from app.crud import log_audit

router = APIRouter(prefix="/api/classes", tags=["Classes & Schools"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[ClassOut])
def get_classes(db: Session = Depends(get_db)):
    schools = db.query(SchoolClass).order_by(SchoolClass.name).all()
    results = []
    for s in schools:
        out = ClassOut.from_orm(s)
        out.student_count = db.query(Student).filter(Student.class_id == s.id).count()
        results.append(out)
    return results

@router.post("/", response_model=ClassOut, status_code=status.HTTP_201_CREATED)
def create_class(
    data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    school_class = SchoolClass(
        name=data.name.strip(),
        grade=data.grade or "قوتابخانە",
        academic_year=data.academic_year or "2025-2026"
    )
    db.add(school_class)
    db.commit()
    db.refresh(school_class)
    log_audit(db, "SCHOOL_CREATED", "School", str(school_class.id), current_user, {"name": data.name})
    
    out = ClassOut.from_orm(school_class)
    out.student_count = 0
    return out

@router.put("/{class_id}", response_model=ClassOut)
def update_class(
    class_id: int,
    data: ClassUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(SchoolClass).filter(SchoolClass.id == class_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="قوتابخانە نەدۆزرایەوە")
    
    if data.name is not None:
        c.name = data.name.strip()
    if data.grade is not None:
        c.grade = data.grade
    if data.academic_year is not None:
        c.academic_year = data.academic_year

    db.commit()
    db.refresh(c)
    log_audit(db, "SCHOOL_UPDATED", "School", str(class_id), current_user, {"name": c.name})
    
    out = ClassOut.from_orm(c)
    out.student_count = db.query(Student).filter(Student.class_id == c.id).count()
    return out

@router.delete("/{class_id}")
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(SchoolClass).filter(SchoolClass.id == class_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="قوتابخانە نەدۆزرایەوە")
    
    # Detach or update students pointing to this school
    db.query(Student).filter(Student.class_id == class_id).update({"class_id": None}, synchronize_session=False)
    
    db.delete(c)
    db.commit()
    log_audit(db, "SCHOOL_DELETED", "School", str(class_id), current_user)
    return {"message": "قوتابخانەکە بە سەرکەوتوویی سڕایەوە"}
