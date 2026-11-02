"""
API Router for Grade 12 Ministerial Quest & Educational Game System.
Supports subjects, chapters, ministerial questions, progress tracking by phone number,
and full admin question/chapter management.
"""

import json
from typing import List, Optional, Dict
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import QuizSubject, QuizChapter, QuizQuestion, QuizProgress, User
from app.auth import get_current_user

router = APIRouter(prefix="/api/quiz", tags=["Grade 12 Ministerial Quiz"])

# ==========================================
# Pydantic Schemas
# ==========================================

class StudentLoginRequest(BaseModel):
    phone_number: str
    student_name: str
    subject_code: str = "physics"

class SubmitAnswerRequest(BaseModel):
    phone_number: str
    student_name: str
    answers: Dict[int, str]  # question_id -> "A", "B", "C", "D"
    time_spent_seconds: int = 0

class AdminQuestionCreate(BaseModel):
    subject_id: int
    chapter_id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    ministerial_year: Optional[str] = "٢٠٢٤ خولی یەکەم"
    explanation_ku: Optional[str] = None

class AdminChapterCreate(BaseModel):
    subject_id: int
    unit_title_ku: str
    section_title_ku: str
    order: int = 1
    required_score_to_unlock: int = 3

# ==========================================
# Initial Seeding Utility for Grade 12
# ==========================================

DEFAULT_SUBJECTS = [
    {
        "code": "physics",
        "name_ku": "فیزیا (Physics)",
        "icon": "⚛️",
        "color": "from-cyan-600 to-blue-600",
        "order": 1,
        "chapters": [
            {
                "unit": "بەشی ١: بارگە کارەباییەکان و هێزی کارەبایی",
                "section": "کەرتی ١: بارگە کارەباییەکان و گەیەنەرەکان",
                "questions": [
                    {
                        "text": "کام لەم تەنۆلکانە بارگەی کارەبایی نەرێنی هەڵدەگرێت لەناو گەردیلەدا؟",
                        "a": "ئەلیکترۆن", "b": "پڕۆتۆن", "c": "نیوترۆن", "d": "فۆتۆن",
                        "correct": "A",
                        "year": "وەزاری ٢٠٢٣ خولی یەکەم",
                        "exp": "ئەلیکترۆن بارگەی نەرێنییە (-1.6 × 10^-19 C) و بە دەوری ناوکدا دەسووڕێتەوە."
                    },
                    {
                        "text": "هێزی کارەبایی نێوان دوو بارگەی خاڵی بەپێی کام یاسای فیزیکی دیاری دەکرێت؟",
                        "a": "یاسای کۆڵۆم (Coulomb's Law)", "b": "یاسای ئۆم", "c": "یاسای فارادای", "d": "یاسای لێنز",
                        "correct": "A",
                        "year": "وەزاری ٢٠٢٤ خولی دووەم",
                        "exp": "یاسای کۆڵۆم بریتییە لە: F = k * |q1 * q2| / r^2"
                    },
                    {
                        "text": "ئەگەر دووری نێوان دوو بارگە دوو هێندە زیاد بکرێت، هێزی کارەبایی نێوانیان چی بەسەر دێت؟",
                        "a": "چوار یەکی لێ دێت (دەبێتە 1/4)", "b": "دوو هێندە زیاد دەکات", "c": "ناگۆڕێت", "d": "نیوە دەبێتەوە",
                        "correct": "A",
                        "year": "وەزاری ٢٠٢٢ خولی یەکەم",
                        "exp": "چونکە هێز پێچەوانە دەگۆڕێت لەگەڵ دووجای دووری (r^2)، زیادبوونی دووری بە ٢ هێندە هێز دەکاتە ١/٤."
                    }
                ]
            },
            {
                "unit": "بەشی ١: بارگە کارەباییەکان و هێزی کارەبایی",
                "section": "کەرتی ٢: بواری کارەبایی و هێڵەکانی بوار",
                "questions": [
                    {
                        "text": "ئاراستەی هێڵەکانی بواری کارەبایی لە بارگەی ئەرێنییەوە بەرەو کوێیە؟",
                        "a": "لە بارگەی ئەرێنی دەردەچێت و بەرەو دەرەوەیە", "b": "بەرەو ناوەوەی بارگەی ئەرێنییە", "c": "شێوەی بازنەییە بە دەوری بارگەکەدا", "d": "هێڵەکانی بوار بوونیان نییە",
                        "correct": "A",
                        "year": "وەزاری ٢٠٢١ خولی یەکەم",
                        "exp": "هێڵەکانی بواری کارەبایی هەمیشە لە بارگەی ئەرێنی بەرەو دەرەوە ئاراستە دەکرێن."
                    }
                ]
            }
        ]
    },
    {
        "code": "biology",
        "name_ku": "زیندەزانی (Biology)",
        "icon": "🔬",
        "color": "from-emerald-600 to-teal-600",
        "order": 2,
        "chapters": [
            {
                "unit": "بەشی ١: پەیکەرە کۆئەندام و ماسوولکە کۆئەندام",
                "section": "کەرتی ١: ئێسکە پەیکەر و پێکهاتەی ئێسک",
                "questions": [
                    {
                        "text": "کۆی ژمارەی ئێسکەکانی لەشی مرۆڤی پێگەیشتوو چەند ئێسکە؟",
                        "a": "٢٠٦ ئێسک", "b": "٣٠٠ ئێسک", "c": "١٥٠ ئێسک", "d": "٢٥٠ ئێسک",
                        "correct": "A",
                        "year": "وەزاری ٢٠٢٤ خولی یەکەم",
                        "exp": "لەشی مرۆڤی پێگەیشتوو لە ٢٠٦ ئێسک پێکدێت."
                    },
                    {
                        "text": "مۆخی سووری ئێسک بەرپرسە لە دروستکردنی کام لەمانە؟",
                        "a": "خڕۆکەکانی خوێن", "b": "چەوری لەش", "c": "هۆڕمۆنی گەشە", "d": "کالسیۆمی ئێسک",
                        "correct": "A",
                        "year": "وەزاری ٢٠٢٣ خولی دووەم",
                        "exp": "مۆخی سوور هەردوو خڕۆکەی سوور و سپی و پەڕەکانی خوێن دروست دەکات."
                    }
                ]
            }
        ]
    },
    {
        "code": "chemistry",
        "name_ku": "کیمیا (Chemistry)",
        "icon": "🧪",
        "color": "from-amber-600 to-orange-600",
        "order": 3,
        "chapters": [
            {
                "unit": "بەشی ١: ترش و تفتەکان",
                "section": "کەرتی ١: پێناسەی ترش و تفت بەپێی ئارینۆس و برۆنشتد-لۆری",
                "questions": [
                    {
                        "text": "بەپێی تیۆری برۆنشتد-لۆری، کام ماددە بە 'ترش' دادەنرێت؟",
                        "a": "بەخشەری پڕۆتۆن (H+)", "b": "وەرگری پڕۆتۆن", "c": "بەخشەری ئەلیکترۆن", "d": "وەرگری هایدرۆکسید",
                        "correct": "A",
                        "year": "وەزاری ٢٠٢٤ خولی یەکەم",
                        "exp": "ترش بەپێی برۆنشتد بریتییە لە بەخشەری پڕۆتۆن (Proton Donor)."
                    }
                ]
            }
        ]
    },
    {
        "code": "math",
        "name_ku": "بیرکاری (Mathematics)",
        "icon": "📐",
        "color": "from-indigo-600 to-purple-600",
        "order": 4,
        "chapters": [
            {
                "unit": "بەشی ١: نەخشەکان و بەها سەرەکییەکان",
                "section": "کەرتی ١: مەودا و بواری نەخشەکان",
                "questions": [
                    {
                        "text": "بواری نەخشەی f(x) = √(x - 3) بریتییە لە:",
                        "a": "[3, ∞)", "b": "(3, ∞)", "c": "(-∞, 3]", "d": "هەموو ژمارە ڕاستەقینەکان R",
                        "correct": "A",
                        "year": "وەزاری ٢٠٢٣ خولی یەکەم",
                        "exp": "ژێر ڕەگی جووت دەبێت گەورەتر یان یەکسان بێت بە سفر: x - 3 ≥ 0 کەواتە x ≥ 3."
                    }
                ]
            }
        ]
    },
    {
        "code": "kurdish",
        "name_ku": "زمانی کوردی (Kurdish)",
        "icon": "📚",
        "color": "from-rose-600 to-pink-600",
        "order": 5,
        "chapters": [
            {
                "unit": "بەشی ئەدەب: ڕێبازی کلاسیک",
                "section": "کەرتی ١: شاعیرانی چوارینەی بابان",
                "questions": [
                    {
                        "text": "سێکوچکەی بابان لە کام شاعیرانە پێکهاتوون؟",
                        "a": "نالی، سالم، کوردی", "b": "مەحوی، حەریق، وەفایی", "c": "گۆران، بێکەس، پیرەمێرد", "d": "خانی، جزیری، فەقێ",
                        "correct": "A",
                        "year": "وەزاری ٢٠٢٤ خولی دووەم",
                        "exp": "سێکوچکەی بابان بریتین لە شاعیرانی کلاسیکی شاری سلێمانی: نالی و سالم و کوردی."
                    }
                ]
            }
        ]
    },
    {
        "code": "english",
        "name_ku": "ئینگلیزی (Sunrise 12)",
        "icon": "🌍",
        "color": "from-teal-600 to-emerald-600",
        "order": 6,
        "chapters": [
            {
                "unit": "Unit 1: World Heritage",
                "section": "Grammar: Present Perfect Continuous vs Simple",
                "questions": [
                    {
                        "text": "Choose the correct sentence:",
                        "a": "She has been working on this project since 9 AM.",
                        "b": "She have been working on this project since 9 AM.",
                        "c": "She has working on this project for 9 AM.",
                        "d": "She is work on this project since 9 AM.",
                        "correct": "A",
                        "year": "Ministerial 2024 Round 1",
                        "exp": "Subject 'She' takes 'has been + V-ing' with 'since' for a starting point."
                    }
                ]
            }
        ]
    },
    {
        "code": "arabic",
        "name_ku": "عەرەبی (Arabic)",
        "icon": "📖",
        "color": "from-amber-700 to-yellow-600",
        "order": 7,
        "chapters": [
            {
                "unit": "الوحدة الأولى: القواعد",
                "section": "أسلوب الاستثناء",
                "questions": [
                    {
                        "text": "ما حكم المستثنى في جملة: 'حضر الطلابُ إلا زيداً'؟",
                        "a": "واجب النصب", "b": "جائز النصب والاتباع", "c": "يعرب حسب موقعه في الجملة", "d": "مجرور بالإضافة",
                        "correct": "A",
                        "year": "الوزاري ٢٠٢٣ الدور الأول",
                        "exp": "الكلام تام مثبت، فيكون المستثنى واجب النصب."
                    }
                ]
            }
        ]
    }
]

def auto_seed_grade12_data(db: Session):
    """Seed default Grade 12 subjects and sample ministerial questions if empty."""
    if db.query(QuizSubject).count() > 0:
        return

    for s_data in DEFAULT_SUBJECTS:
        subj = QuizSubject(
            code=s_data["code"],
            name_ku=s_data["name_ku"],
            grade="12",
            icon=s_data["icon"],
            color=s_data["color"],
            order=s_data["order"],
            is_active=True
        )
        db.add(subj)
        db.flush()

        for ch_order, ch_data in enumerate(s_data["chapters"], start=1):
            ch = QuizChapter(
                subject_id=subj.id,
                unit_title_ku=ch_data["unit"],
                section_title_ku=ch_data["section"],
                order=ch_order,
                required_score_to_unlock=2
            )
            db.add(ch)
            db.flush()

            for q_data in ch_data["questions"]:
                q = QuizQuestion(
                    subject_id=subj.id,
                    chapter_id=ch.id,
                    question_text=q_data["text"],
                    option_a=q_data["a"],
                    option_b=q_data["b"],
                    option_c=q_data["c"],
                    option_d=q_data["d"],
                    correct_option=q_data["correct"],
                    ministerial_year=q_data["year"],
                    explanation_ku=q_data["exp"]
                )
                db.add(q)

    db.commit()


# ==========================================
# Public Student Endpoints
# ==========================================

@router.get("/subjects")
def get_subjects(db: Session = Depends(get_db)):
    """List all available Grade 12 subjects with chapter & question counts."""
    auto_seed_grade12_data(db)

    subjects = db.query(QuizSubject).filter(QuizSubject.is_active == True).order_by(QuizSubject.order).all()
    res = []
    for s in subjects:
        total_chapters = db.query(QuizChapter).filter(QuizChapter.subject_id == s.id).count()
        total_questions = db.query(QuizQuestion).filter(QuizQuestion.subject_id == s.id).count()
        res.append({
            "id": s.id,
            "code": s.code,
            "name_ku": s.name_ku,
            "grade": s.grade,
            "icon": s.icon,
            "color": s.color,
            "total_chapters": total_chapters,
            "total_questions": total_questions
        })
    return res


@router.post("/student/login")
def student_login(payload: StudentLoginRequest, db: Session = Depends(get_db)):
    """
    Log in or resume student progress using Phone Number.
    Preserves exact unlocked and completed sections across sessions.
    """
    auto_seed_grade12_data(db)

    clean_phone = payload.phone_number.strip().replace(" ", "").replace("-", "")
    if len(clean_phone) < 10:
        raise HTTPException(status_code=400, detail="تکایە ژمارەی مۆبایلی دروست بنووسە (لانیکەم ١٠ ژمارە)")

    progress = db.query(QuizProgress).filter(
        QuizProgress.phone_number == clean_phone,
        QuizProgress.subject_code == payload.subject_code
    ).first()

    # Get all chapters for this subject
    subj = db.query(QuizSubject).filter(QuizSubject.code == payload.subject_code).first()
    if not subj:
        raise HTTPException(status_code=404, detail="بابەتەکە نەدۆزرایەوە")

    first_chapter = db.query(QuizChapter).filter(QuizChapter.subject_id == subj.id).order_by(QuizChapter.order).first()
    first_ch_id = first_chapter.id if first_chapter else 1

    if not progress:
        # Create new student profile with the first section unlocked
        progress = QuizProgress(
            phone_number=clean_phone,
            student_name=payload.student_name.strip() or "قوتابی پۆلی ١٢",
            subject_code=payload.subject_code,
            unlocked_chapter_ids_json=json.dumps([first_ch_id]),
            completed_chapter_ids_json=json.dumps([]),
            total_score=0,
            total_correct=0,
            total_wrong=0,
            badges_json=json.dumps(["پێشەنگی پۆلی ١٢ 🎓"])
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
    else:
        # Update name if changed and touch last_active
        if payload.student_name and payload.student_name.strip():
            progress.student_name = payload.student_name.strip()
        progress.last_active = datetime.utcnow()
        db.commit()

    unlocked_ids = json.loads(progress.unlocked_chapter_ids_json or "[]")
    if first_ch_id not in unlocked_ids:
        unlocked_ids.append(first_ch_id)
        progress.unlocked_chapter_ids_json = json.dumps(unlocked_ids)
        db.commit()

    return {
        "phone_number": progress.phone_number,
        "student_name": progress.student_name,
        "subject_code": progress.subject_code,
        "unlocked_chapter_ids": json.loads(progress.unlocked_chapter_ids_json or "[]"),
        "completed_chapter_ids": json.loads(progress.completed_chapter_ids_json or "[]"),
        "total_score": progress.total_score,
        "total_correct": progress.total_correct,
        "total_wrong": progress.total_wrong,
        "badges": json.loads(progress.badges_json or "[]")
    }


@router.get("/subject/{subject_code}/chapters")
def get_subject_chapters(subject_code: str, phone_number: Optional[str] = None, db: Session = Depends(get_db)):
    """List all units & sections for a subject, indicating locked/unlocked state for this phone."""
    auto_seed_grade12_data(db)

    subj = db.query(QuizSubject).filter(QuizSubject.code == subject_code).first()
    if not subj:
        raise HTTPException(status_code=404, detail="بابەتەکە نەدۆزرایەوە")

    chapters = db.query(QuizChapter).filter(QuizChapter.subject_id == subj.id).order_by(QuizChapter.order).all()

    unlocked_ids = set()
    completed_ids = set()

    if phone_number:
        clean_phone = phone_number.strip().replace(" ", "").replace("-", "")
        progress = db.query(QuizProgress).filter(
            QuizProgress.phone_number == clean_phone,
            QuizProgress.subject_code == subject_code
        ).first()
        if progress:
            unlocked_ids = set(json.loads(progress.unlocked_chapter_ids_json or "[]"))
            completed_ids = set(json.loads(progress.completed_chapter_ids_json or "[]"))

    # Always ensure first chapter is unlocked
    if chapters and chapters[0].id not in unlocked_ids:
        unlocked_ids.add(chapters[0].id)

    res = []
    for ch in chapters:
        q_count = db.query(QuizQuestion).filter(QuizQuestion.chapter_id == ch.id).count()
        res.append({
            "id": ch.id,
            "unit_title_ku": ch.unit_title_ku,
            "section_title_ku": ch.section_title_ku,
            "order": ch.order,
            "question_count": q_count,
            "required_score": ch.required_score_to_unlock,
            "is_unlocked": ch.id in unlocked_ids,
            "is_completed": ch.id in completed_ids
        })
    return {
        "subject": {
            "id": subj.id,
            "code": subj.code,
            "name_ku": subj.name_ku,
            "icon": subj.icon,
            "color": subj.color
        },
        "chapters": res
    }


@router.get("/section/{chapter_id}/questions")
def get_section_questions(chapter_id: int, db: Session = Depends(get_db)):
    """Fetch ministerial questions for an unlocked section (without leaking correct answers)."""
    ch = db.query(QuizChapter).filter(QuizChapter.id == chapter_id).first()
    if not ch:
        raise HTTPException(status_code=404, detail="کەرتەکە نەدۆزرایەوە")

    questions = db.query(QuizQuestion).filter(QuizQuestion.chapter_id == chapter_id).all()
    return {
        "chapter_id": ch.id,
        "unit_title_ku": ch.unit_title_ku,
        "section_title_ku": ch.section_title_ku,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "options": [q.option_a, q.option_b, q.option_c, q.option_d],
                "ministerial_year": q.ministerial_year or "پرسیاری فەرمیی وەزاری"
            }
            for q in questions
        ]
    }


@router.post("/section/{chapter_id}/submit")
def submit_section_answers(chapter_id: int, payload: SubmitAnswerRequest, db: Session = Depends(get_db)):
    """
    Submits student answers for a section.
    Computes score, unlocks the next section if passed, and awards badges.
    """
    ch = db.query(QuizChapter).filter(QuizChapter.id == chapter_id).first()
    if not ch:
        raise HTTPException(status_code=404, detail="کەرتەکە نەدۆزرایەوە")

    questions = db.query(QuizQuestion).filter(QuizQuestion.chapter_id == chapter_id).all()
    if not questions:
        raise HTTPException(status_code=400, detail="هیچ پرسیارێک لەم کەرتەدا نییە")

    clean_phone = payload.phone_number.strip().replace(" ", "").replace("-", "")
    subj = db.query(QuizSubject).filter(QuizSubject.id == ch.subject_id).first()

    progress = db.query(QuizProgress).filter(
        QuizProgress.phone_number == clean_phone,
        QuizProgress.subject_code == (subj.code if subj else "physics")
    ).first()

    if not progress:
        progress = QuizProgress(
            phone_number=clean_phone,
            student_name=payload.student_name.strip() or "قوتابی پۆلی ١٢",
            subject_code=subj.code if subj else "physics",
            unlocked_chapter_ids_json=json.dumps([ch.id]),
            completed_chapter_ids_json=json.dumps([]),
            total_score=0,
            total_correct=0,
            total_wrong=0,
            badges_json=json.dumps(["پێشەنگی پۆلی ١٢ 🎓"])
        )
        db.add(progress)
        db.flush()

    correct_count = 0
    wrong_count = 0
    feedback_list = []
    option_letters = ["A", "B", "C", "D"]

    for q in questions:
        user_choice = payload.answers.get(q.id)
        # Normalize choice (could be 'A' or '0')
        if isinstance(user_choice, int):
            user_choice_letter = option_letters[user_choice] if 0 <= user_choice < 4 else ""
        else:
            user_choice_letter = str(user_choice).strip().upper() if user_choice else ""

        is_correct = user_choice_letter == q.correct_option.strip().upper()
        if is_correct:
            correct_count += 1
        else:
            wrong_count += 1

        feedback_list.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "user_choice": user_choice_letter,
            "correct_option": q.correct_option,
            "is_correct": is_correct,
            "ministerial_year": q.ministerial_year,
            "explanation_ku": q.explanation_ku or "وەڵامی دروست بەپێی کلیلەکانی وەزارەتی پەروەردە دیاریکراوە."
        })

    # Passing criteria: >= 60% or >= required_score_to_unlock
    passed = correct_count >= min(ch.required_score_to_unlock, len(questions))

    unlocked_ids = set(json.loads(progress.unlocked_chapter_ids_json or "[]"))
    completed_ids = set(json.loads(progress.completed_chapter_ids_json or "[]"))

    next_chapter_unlocked = False
    newly_unlocked_chapter_title = None

    if passed:
        completed_ids.add(ch.id)
        # Find next chapter in order
        next_ch = db.query(QuizChapter).filter(
            QuizChapter.subject_id == ch.subject_id,
            QuizChapter.order > ch.order
        ).order_by(QuizChapter.order).first()

        if next_ch:
            if next_ch.id not in unlocked_ids:
                unlocked_ids.add(next_ch.id)
                next_chapter_unlocked = True
                newly_unlocked_chapter_title = f"{next_ch.unit_title_ku} - {next_ch.section_title_ku}"

    # Calculate points: 20 pts per correct answer + 50 pts bonus for passing
    points_earned = (correct_count * 20) + (50 if passed else 0)
    progress.total_score += points_earned
    progress.total_correct += correct_count
    progress.total_wrong += wrong_count
    progress.unlocked_chapter_ids_json = json.dumps(list(unlocked_ids))
    progress.completed_chapter_ids_json = json.dumps(list(completed_ids))
    progress.last_active = datetime.utcnow()

    # Check for new badges
    badges = set(json.loads(progress.badges_json or "[]"))
    if passed and "قوفڵشکێن 🔓" not in badges:
        badges.add("قوفڵشکێن 🔓")
    if len(completed_ids) >= 3 and "مامۆستای بەشەکان 🏆" not in badges:
        badges.add("مامۆستای بەشەکان 🏆")
    if progress.total_correct >= 20 and "بلیمەتی وەزاری 🌟" not in badges:
        badges.add("بلیمەتی وەزاری 🌟")
    progress.badges_json = json.dumps(list(badges))

    db.commit()

    return {
        "passed": passed,
        "score_earned": points_earned,
        "total_score": progress.total_score,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "total_questions": len(questions),
        "percentage": round((correct_count / len(questions)) * 100, 1) if questions else 0,
        "next_chapter_unlocked": next_chapter_unlocked,
        "newly_unlocked_chapter_title": newly_unlocked_chapter_title,
        "unlocked_chapter_ids": list(unlocked_ids),
        "completed_chapter_ids": list(completed_ids),
        "badges": list(badges),
        "feedback": feedback_list
    }


@router.get("/leaderboard")
def get_quiz_leaderboard(subject_code: Optional[str] = None, db: Session = Depends(get_db)):
    """Top 20 students by total points and completed ministerial sections."""
    query = db.query(QuizProgress)
    if subject_code:
        query = query.filter(QuizProgress.subject_code == subject_code)

    top_students = query.order_by(QuizProgress.total_score.desc()).limit(20).all()

    res = []
    for rank, st in enumerate(top_students, start=1):
        completed = json.loads(st.completed_chapter_ids_json or "[]")
        res.append({
            "rank": rank,
            "student_name": st.student_name,
            "phone_masked": f"{st.phone_number[:4]}***{st.phone_number[-3:]}",
            "subject_code": st.subject_code,
            "total_score": st.total_score,
            "completed_sections_count": len(completed),
            "badges": json.loads(st.badges_json or "[]")
        })
    return res


# ==========================================
# Admin Management Endpoints
# ==========================================

@router.post("/admin/chapter")
def admin_create_chapter(payload: AdminChapterCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Admin endpoint to create a new unit & section."""
    ch = QuizChapter(
        subject_id=payload.subject_id,
        unit_title_ku=payload.unit_title_ku.strip(),
        section_title_ku=payload.section_title_ku.strip(),
        order=payload.order,
        required_score_to_unlock=payload.required_score_to_unlock
    )
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return {"status": "success", "chapter_id": ch.id}


@router.post("/admin/question")
def admin_create_question(payload: AdminQuestionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Admin endpoint to create a new ministerial question."""
    q = QuizQuestion(
        subject_id=payload.subject_id,
        chapter_id=payload.chapter_id,
        question_text=payload.question_text.strip(),
        option_a=payload.option_a.strip(),
        option_b=payload.option_b.strip(),
        option_c=payload.option_c.strip(),
        option_d=payload.option_d.strip(),
        correct_option=payload.correct_option.strip().upper(),
        ministerial_year=payload.ministerial_year,
        explanation_ku=payload.explanation_ku
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return {"status": "success", "question_id": q.id}


@router.delete("/admin/question/{question_id}")
def admin_delete_question(question_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Admin endpoint to delete a question."""
    q = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="پرسیارەکە نەدۆزرایەوە")
    db.delete(q)
    db.commit()
    return {"status": "success", "message": "پرسیارەکە بە سەرکەوتوویی سڕدرایەوە"}


@router.get("/admin/stats")
def admin_get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Admin overview of subjects, questions, chapters, and registered playing students."""
    total_subjects = db.query(QuizSubject).count()
    total_chapters = db.query(QuizChapter).count()
    total_questions = db.query(QuizQuestion).count()
    total_students = db.query(QuizProgress).count()

    return {
        "total_subjects": total_subjects,
        "total_chapters": total_chapters,
        "total_questions": total_questions,
        "total_active_students": total_students
    }
