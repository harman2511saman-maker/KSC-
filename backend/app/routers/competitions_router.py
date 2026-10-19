"""
Competitions & School Leaderboard Router.
Computes real-time rankings, school aggregate tournament scores,
all-student rankings, and student rank lookup.
"""

import json
import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from typing import Optional, List, Dict, Any

from app.database import get_db
from app.models import Result, Exam, Student, SchoolClass, OMRCalibration, User
from app.auth import get_current_user

router = APIRouter(prefix="/api/competitions", tags=["Competitions"])

DEFAULT_SYSTEM_SETTINGS = {
    "announcement": {
        "enabled": True,
        "text": "ئەنجامی فەرمیی تاقیکردنەوەکانی پلاتفۆرمی KSC بڵاوکرایەوە • پیرۆزبایی لە سەرجەم قوتابییان و قوتابخانە سەرکەوتووەکان دەکەین!",
        "badge": "ئاگاداری گرنگ"
    },
    "certificate_config": {
        "enabled": True,
        "title": "بڕوانامەی ڕێزلێنان و سەرکەوتن",
        "min_percentage": 75.0,
        "top_ranks_only": False,
        "appreciation_text": "بە بۆنەی بەشداریکردنی کارا و بەدەستهێنانی پلەی شایستە لە پلاتفۆرمی فەرمیی پێشبڕکێی قوتابییانی کوردستان",
        "signee_name": "سەرپەرشتیاری گشتیی پڕۆژەی KSC",
        "signee_title": "لیژنەی باڵای هەڵسەنگاندن و تاقیکردنەوەکان"
    }
}

def get_system_settings_dict(db: Session) -> dict:
    calib = db.query(OMRCalibration).filter(OMRCalibration.key == "system_settings").first()
    if not calib:
        return DEFAULT_SYSTEM_SETTINGS
    try:
        data = json.loads(calib.value_json)
        res = dict(DEFAULT_SYSTEM_SETTINGS)
        res.update(data)
        return res
    except Exception:
        return DEFAULT_SYSTEM_SETTINGS

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
        
        if student_count == 0:
            continue

        total_score = sum(r.total_score or 0.0 for r in results)
        max_score = sum(r.max_score or 100.0 for r in results)
        avg_percentage = round(sum(r.percentage or 0.0 for r in results) / student_count, 1)
        passed_count = sum(1 for r in results if r.status == "PASSED" or (r.percentage or 0.0) >= 50.0)
        top_score = max((r.percentage or 0.0) for r in results)

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
    overall_avg = round(sum(s["average_percentage"] for s in schools_ranking) / max(1, len(schools_ranking)), 1) if schools_ranking else 0.0
    total_passed = sum(s["passed_students"] for s in schools_ranking)
    overall_success_rate = round((total_passed / max(1, total_participants)) * 100, 1) if total_participants > 0 else 0.0

    return {
        "exams_list": exams_list,
        "classes_list": classes_list,
        "schools_count": len(schools_ranking),
        "total_participants": total_participants,
        "overall_average": overall_avg,
        "total_passed": total_passed,
        "overall_success_rate": overall_success_rate,
        "schools_ranking": schools_ranking,
        "top_students": top_students,
        "students_leaderboard": paginated_students,
        "total_students_count": total_matching_students
    }

@router.get("/settings")
def get_public_settings(db: Session = Depends(get_db)):
    """Returns public settings for announcement ticker and certificate eligibility rules."""
    return get_system_settings_dict(db)

@router.put("/settings")
def update_public_settings(
    settings: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin endpoint to update announcement banner and certificate configuration."""
    calib = db.query(OMRCalibration).filter(OMRCalibration.key == "system_settings").first()
    if not calib:
        calib = OMRCalibration(key="system_settings", value_json=json.dumps(settings, ensure_ascii=False))
        db.add(calib)
    else:
        calib.value_json = json.dumps(settings, ensure_ascii=False)
    db.commit()
    return {"message": "ڕێکخستنەکانی سیستەم بە سەرکەوتوویی نوێکرانەوە", "settings": settings}

@router.post("/admin/backup")
def trigger_database_backup(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin endpoint to create a timestamped database backup."""
    db_paths = ["/app/data/omr_system.db", "data/omr_system.db", "backend/omr_system.db", "omr_system.db"]
    source = None
    for p in db_paths:
        if os.path.exists(p):
            source = p
            break
            
    if not source:
        raise HTTPException(status_code=404, detail="داتابەیس نەدۆزرایەوە بۆ پاشەکەوتکردن")
        
    backup_dir = os.path.join(os.path.dirname(source), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(backup_dir, f"omr_backup_{ts}.db")
    shutil.copy2(source, backup_file)
    
    existing = sorted([f for f in os.listdir(backup_dir) if f.startswith("omr_backup_")])
    
    return {
        "success": True,
        "message": f"پاشەکەوت بە سەرکەوتوویی دروستکرا: omr_backup_{ts}.db",
        "file": f"omr_backup_{ts}.db",
        "total_backups": len(existing)
    }

@router.get("/public-search")
def search_student_public_result(
    student_code: Optional[str] = Query(None, description="Student code to lookup score card"),
    student_name: Optional[str] = Query(None, description="Student name to lookup score card"),
    db: Session = Depends(get_db)
):
    """
    Public search endpoint by code OR name that returns verified score, precise rank position across Kurdistan,
    school rank, percentile, annotated OMR sheet overlay, and admin-controlled certificate data.
    """
    settings = get_system_settings_dict(db)
    cert_cfg = settings.get("certificate_config", DEFAULT_SYSTEM_SETTINGS["certificate_config"])

    if not student_code and not student_name:
        return {"found": False, "message_ku": "تکایە کۆدی قوتابی یان ناوی سیانی بنووسە"}

    student = None
    if student_code and student_code.strip():
        code_cleaned = student_code.strip()
        student = db.query(Student).filter(
            or_(Student.student_id == code_cleaned, Student.qr_identifier == code_cleaned)
        ).first()
        if not student:
            return {"found": False, "message_ku": "هیچ قوتابییەک بەم کۆدە نەدۆزرایەوە"}
    elif student_name and student_name.strip():
        name_cleaned = student_name.strip()
        matching_students = db.query(Student).filter(
            Student.name.ilike(f"%{name_cleaned}%")
        ).all()
        if not matching_students:
            return {"found": False, "message_ku": "هیچ قوتابییەک بەم ناوە نەدۆزرایەوە"}
        if len(matching_students) > 1:
            matches = [
                {
                    "student_code": s.student_id,
                    "student_name": s.name,
                    "school_name": s.school_class.name if s.school_class else "—",
                    "grade": s.grade
                }
                for s in matching_students
            ]
            return {
                "found": False,
                "multiple_matches": True,
                "matches": matches,
                "message_ku": f"{len(matches)} قوتابی بەم ناوە دۆزرایەوە، تکایە قوتابخانەکەت هەڵبژێرە"
            }
        student = matching_students[0]

    if not student:
        return {"found": False, "message_ku": "زانیاری قوتابی نەدۆزرایەوە"}

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

        # Check Certificate Eligibility based on Admin's exact rules
        min_pct = float(cert_cfg.get("min_percentage", 75.0))
        cert_enabled = bool(cert_cfg.get("enabled", True))
        pct = float(r.percentage or 0.0)
        
        is_eligible = cert_enabled and (pct >= min_pct)
        if cert_cfg.get("top_ranks_only", False):
            is_eligible = is_eligible and (rank_in_exam <= 10)

        certificate_data = None
        if is_eligible:
            certificate_data = {
                "certificate_id": f"KSC-{r.id:04d}-{student.id:04d}",
                "title": cert_cfg.get("title", "بڕوانامەی ڕێزلێنان و سەرکەوتن"),
                "appreciation_text": cert_cfg.get("appreciation_text", "بە بۆنەی بەشداریکردنی کارا و بەدەستهێنانی پلەی شایستە لە پلاتفۆرمی فەرمیی پێشبڕکێی قوتابییانی کوردستان"),
                "signee_name": cert_cfg.get("signee_name", "سەرپەرشتیاری گشتیی پڕۆژەی KSC"),
                "signee_title": cert_cfg.get("signee_title", "لیژنەی باڵای هەڵسەنگاندن و تاقیکردنەوەکان"),
                "student_name": student.name,
                "school_name": student.school_class.name if student.school_class else "—",
                "grade": student.grade,
                "exam_name": r.exam.exam_name if r.exam else "—",
                "subject": r.exam.subject if r.exam else "—",
                "total_score": r.total_score,
                "max_score": r.max_score,
                "percentage": r.percentage,
                "overall_rank": rank_in_exam,
                "total_participants": total_in_exam,
                "date": r.created_at.strftime("%Y/%m/%d") if r.created_at else ""
            }

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
            "certificate_eligible": is_eligible,
            "certificate_data": certificate_data,
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


