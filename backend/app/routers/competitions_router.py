"""
Competitions & School Leaderboard Router.
Computes real-time rankings, school aggregate tournament scores,
all-student rankings, and student rank lookup.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from typing import Optional, List, Dict, Any

from app.database import get_db
from app.models import Result, Exam, Student, SchoolClass

router = APIRouter(prefix="/api/competitions", tags=["Competitions"])

@router.get("/leaderboard")
def get_competition_leaderboard(
    exam_id: Optional[int] = None,
    class_id: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "percentage",
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Computes school-level and full student-level tournament rankings with flexible filters.
    """
    # Available exams for dropdown filter
    all_exams = db.query(Exam).order_by(desc(Exam.created_at)).all()
    exams_list = [{"id": e.id, "name": e.exam_name, "subject": e.subject, "grade": e.grade} for e in all_exams]

    # Available schools for dropdown filter
    all_classes = db.query(SchoolClass).order_by(SchoolClass.name).all()
    classes_list = [{"id": c.id, "name": c.name, "grade": c.grade} for c in all_classes]

    # 1. School Rankings
    schools_query = db.query(SchoolClass)
    if class_id:
        schools_query = schools_query.filter(SchoolClass.id == class_id)
    schools = schools_query.all()
    schools_ranking = []

    for s in schools:
        query = db.query(Result).join(Result.student).filter(Student.class_id == s.id)
        if exam_id:
            query = query.filter(Result.exam_id == exam_id)
        
        results = query.all()
        student_count = len(results)
        
        if student_count > 0:
            total_score = sum(r.total_score for r in results)
            max_score = sum(r.max_score for r in results)
            avg_percentage = round(sum(r.percentage for r in results) / student_count, 1)
            passed_count = sum(1 for r in results if r.status == "PASSED" or r.percentage >= 50.0)
            top_score = max(r.percentage for r in results)
        else:
            total_score = 0.0
            max_score = 0.0
            avg_percentage = 0.0
            passed_count = 0
            top_score = 0.0

        schools_ranking.append({
            "school_id": s.id,
            "school_name": s.name,
            "students_participated": student_count,
            "total_score": round(total_score, 1),
            "max_possible_score": round(max_score, 1),
            "average_percentage": avg_percentage,
            "passed_students": passed_count,
            "highest_student_score": top_score,
            "success_rate": round((passed_count / max(1, student_count)) * 100, 1)
        })

    # Sort schools
    schools_ranking.sort(key=lambda x: (x["average_percentage"], x["total_score"]), reverse=True)

    for rank, item in enumerate(schools_ranking, start=1):
        item["rank"] = rank
        if rank == 1:
            item["badge"] = "🥇 پلەی یەکەم"
        elif rank == 2:
            item["badge"] = "🥈 پلەی دووەم"
        elif rank == 3:
            item["badge"] = "🥉 پلەی سێیەم"
        else:
            item["badge"] = f"پلەی {rank}"

    # 2. All Students Leaderboard (Calculated across all participants)
    student_query = db.query(Result).join(Result.student).outerjoin(Student.school_class).join(Result.exam)
    if exam_id:
        student_query = student_query.filter(Result.exam_id == exam_id)
    if class_id:
        student_query = student_query.filter(Student.class_id == class_id)
    if search and search.strip():
        term = f"%{search.strip()}%"
        student_query = student_query.filter(
            or_(
                Student.name.ilike(term),
                Student.student_id.ilike(term),
                SchoolClass.name.ilike(term)
            )
        )

    # Order by highest percentage & score
    all_student_results = student_query.order_by(desc(Result.percentage), desc(Result.total_score)).all()
    total_matching_students = len(all_student_results)

    all_students_ranked = []
    for rank, r in enumerate(all_student_results, start=1):
        all_students_ranked.append({
            "rank": rank,
            "result_id": r.id,
            "student_name": r.student.name if r.student else "نادیار",
            "student_code": r.student.student_id if r.student else "—",
            "school_id": r.student.class_id if r.student else None,
            "school_name": r.student.school_class.name if r.student and r.student.school_class else "—",
            "exam_name": r.exam.exam_name if r.exam else "—",
            "score": r.total_score,
            "max_score": r.max_score,
            "percentage": r.percentage,
            "status": r.status,
            "correct_count": r.correct_count,
            "incorrect_count": r.incorrect_count
        })

    # Paginate students list
    paginated_students = all_students_ranked[offset : offset + limit]

    # Top 3 Podium Students
    top_students = all_students_ranked[:10]

    # 3. Overall Stats
    total_participants = sum(s["students_participated"] for s in schools_ranking)
    overall_avg = round(sum(s["average_percentage"] for s in schools_ranking) / max(1, len(schools_ranking)), 1)
    total_passed = sum(s["passed_students"] for s in schools_ranking)

    return {
        "exams_list": exams_list,
        "classes_list": classes_list,
        "schools_count": len(schools),
        "total_participants": total_participants,
        "overall_average": overall_avg,
        "total_passed": total_passed,
        "overall_success_rate": round((total_passed / max(1, total_participants)) * 100, 1),
        "schools_ranking": schools_ranking,
        "top_students": top_students,
        "students_leaderboard": paginated_students,
        "total_students_count": total_matching_students
    }

@router.get("/public-search")
def search_student_public_result(
    student_code: str = Query(..., description="Student code to lookup score card"),
    db: Session = Depends(get_db)
):
    """
    Public search endpoint that returns verified score, precise rank position across Kurdistan,
    school rank, percentile, and annotated OMR sheet overlay.
    """
    code_cleaned = student_code.strip()
    student = db.query(Student).filter(
        or_(Student.student_id == code_cleaned, Student.qr_identifier == code_cleaned)
    ).first()

    if not student:
        return {"found": False, "message_ku": "هیچ قوتابییەک بەم کۆدە نەدۆزرایەوە"}

    results = db.query(Result).filter(Result.student_id == student.id).order_by(desc(Result.created_at)).all()
    res_list = []
    
    for r in results:
        scan_page = r.scan_page
        
        # Calculate Kurdistan Overall Rank for this specific exam
        all_exam_results = db.query(Result).filter(Result.exam_id == r.exam_id).order_by(
            desc(Result.percentage), desc(Result.total_score)
        ).all()
        
        total_in_exam = len(all_exam_results)
        rank_in_exam = 1
        for idx, ex_res in enumerate(all_exam_results, start=1):
            if ex_res.id == r.id:
                rank_in_exam = idx
                break

        # Calculate School Rank
        school_results = [res for res in all_exam_results if res.student and res.student.class_id == student.class_id]
        total_in_school = len(school_results)
        rank_in_school = 1
        for idx, sch_res in enumerate(school_results, start=1):
            if sch_res.id == r.id:
                rank_in_school = idx
                break

        percentile = round(((total_in_exam - rank_in_exam + 1) / max(1, total_in_exam)) * 100, 1)

        # Load answers list
        answers = []
        if scan_page:
            answer_key_map = {}
            if r.exam:
                for q in r.exam.questions:
                    answer_key_map[q.question_num] = q.correct_answer

            det_answers = scan_page.detected_answers
            for a in det_answers:
                corr_ans = answer_key_map.get(a.question_num)
                is_multiple = (a.machine_status == "MULTIPLE")
                is_blank = (a.machine_status == "BLANK" or not a.final_answer) and not is_multiple
                is_correct = (a.final_answer == corr_ans and not is_multiple and not is_blank) if corr_ans else False

                answers.append({
                    "question_num": a.question_num,
                    "student_answer": "دوو وەڵام" if is_multiple else (a.final_answer or "—"),
                    "correct_answer": corr_ans,
                    "is_correct": is_correct,
                    "eval_status": "CORRECT" if is_correct else ("MULTIPLE" if is_multiple else ("BLANK" if is_blank else "INCORRECT")),
                    "machine_status": a.machine_status
                })
            answers.sort(key=lambda x: x["question_num"])

        res_list.append({
            "result_id": r.id,
            "exam_name": r.exam.exam_name if r.exam else "—",
            "subject": r.exam.subject if r.exam else "—",
            "total_score": r.total_score,
            "max_score": r.max_score,
            "percentage": r.percentage,
            "correct_count": r.correct_count,
            "incorrect_count": r.incorrect_count,
            "blank_count": r.blank_count,
            "multiple_count": r.multiple_count,
            "status": r.status,
            "overall_rank": rank_in_exam,
            "total_participants": total_in_exam,
            "school_rank": rank_in_school,
            "total_in_school": total_in_school,
            "percentile": percentile,
            "debug_file": scan_page.debug_file if scan_page else None,
            "normalized_file": scan_page.normalized_file if scan_page else None,
            "created_at": r.created_at,
            "answers": answers
        })

    return {
        "found": True,
        "student_name": student.name,
        "student_code": student.student_id,
        "school_name": student.school_class.name if student.school_class else "—",
        "grade": student.grade,
        "results": res_list
    }

