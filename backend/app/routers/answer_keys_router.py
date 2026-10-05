"""
Answer Key Builder and Editor Router.
Allows teachers to configure correct answers, marks per question, and bonus/ungraded questions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models import Exam, ExamQuestion, User
from app.schemas import ExamQuestionItem, AnswerKeyUpdate
from app.auth import get_current_user
from app.crud import log_audit

router = APIRouter(prefix="/api/answer-keys", tags=["Answer Keys"], dependencies=[Depends(get_current_user)])

@router.get("/{exam_id}")
def get_answer_key(exam_id: str, db: Session = Depends(get_db)):
    clean_id = int(str(exam_id).lstrip(':')) if str(exam_id).lstrip(':').isdigit() else None
    if not clean_id:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")
    exam = db.query(Exam).filter(Exam.id == clean_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")

    questions = db.query(ExamQuestion).filter(ExamQuestion.exam_id == clean_id).order_by(ExamQuestion.question_num).all()
    
    choices_list = [c.strip() for c in exam.choices.split(",")]
    
    items = []
    for q in questions:
        items.append({
            "id": q.id,
            "question_num": q.question_num,
            "correct_answer": q.correct_answer,
            "marks": q.marks,
            "is_ungraded": q.is_ungraded
        })

    filled_count = sum(1 for q in questions if q.correct_answer or q.is_ungraded)
    is_complete = (filled_count >= exam.number_of_questions and exam.number_of_questions > 0)

    return {
        "exam_id": exam.id,
        "exam_name": exam.exam_name,
        "number_of_questions": exam.number_of_questions,
        "choices": choices_list,
        "total_marks": exam.total_marks,
        "pass_mark": exam.pass_mark,
        "is_complete": is_complete,
        "filled_count": filled_count,
        "questions": items
    }

@router.put("/{exam_id}")
def update_answer_key(
    exam_id: int,
    data: AnswerKeyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="تاقیکردنەوە نەدۆزرایەوە")

    choices_set = {c.strip() for c in exam.choices.split(",")}

    # Update or insert question items
    for item in data.questions:
        q_obj = db.query(ExamQuestion).filter(
            ExamQuestion.exam_id == exam_id,
            ExamQuestion.question_num == item.question_num
        ).first()

        if item.correct_answer and item.correct_answer not in choices_set:
            raise HTTPException(
                status_code=400,
                detail=f"هەڵبژاردەی '{item.correct_answer}' لە لیستی هەڵبژاردەکانی ئەم تاقیکردنەوەیەدا نییە ({exam.choices})"
            )

        if not q_obj:
            q_obj = ExamQuestion(
                exam_id=exam_id,
                question_num=item.question_num,
                correct_answer=item.correct_answer,
                marks=item.marks if item.marks is not None else 1.0,
                is_ungraded=item.is_ungraded or False
            )
            db.add(q_obj)
        else:
            q_obj.correct_answer = item.correct_answer
            if item.marks is not None:
                q_obj.marks = item.marks
            if item.is_ungraded is not None:
                q_obj.is_ungraded = item.is_ungraded

    db.commit()
    log_audit(db, "ANSWER_KEY_UPDATED", "Exam", str(exam_id), current_user, {"count": len(data.questions)})

    return {"message": "کلیلی وەڵام بە سەرکەوتوویی پاشەکەوت کرا"}
