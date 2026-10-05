"""
Results Export Router.
Generates CSV and XLSX spreadsheet exports preserving Kurdish Sorani Unicode and headers.
"""

import io
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from app.database import get_db
from app.models import Result, Exam, Student, SchoolClass, User
from app.auth import get_current_user
from app.crud import log_audit

router = APIRouter(prefix="/api/export", tags=["Exports"])

def get_results_dataframe(exam_id: Optional[int], class_id: Optional[int], db: Session) -> pd.DataFrame:
    query = db.query(Result).join(Result.exam).outerjoin(Result.student)

    if exam_id:
        query = query.filter(Result.exam_id == exam_id)
    if class_id:
        query = query.filter(Student.class_id == class_id)

    results = query.order_by(desc(Result.percentage)).all()

    data = []
    for idx, r in enumerate(results, start=1):
        status_ku = "دەرچوو" if r.status == "PASSED" else ("کەوتوو" if r.status == "FAILED" else "پێویستی بە پێداچوونەوەیە")
        data.append({
            "ڕیزبەندی": idx,
            "کۆدی قوتابی": r.student.student_id if r.student else "—",
            "ناوی قوتابی": r.student.name if r.student else "نادیار",
            "پۆل": r.student.school_class.name if (r.student and r.student.school_class) else "—",
            "تاقیکردنەوە": r.exam.exam_name if r.exam else "—",
            "بابەت": r.exam.subject if r.exam else "—",
            "وەڵامی دروست": r.correct_count,
            "وەڵامی هەڵە": r.incorrect_count,
            "بەتاڵ": r.blank_count,
            "نمرە": r.total_score,
            "کۆی گشتی": r.max_score,
            "ڕێژەی سەدی (%)": f"{r.percentage:.1f}%",
            "بارودۆخ": status_ku,
            "بەرواری سکان": r.created_at.strftime("%Y-%m-%d %H:%M")
        })

    return pd.DataFrame(data)

@router.get("/xlsx")
def export_results_xlsx(
    exam_id: Optional[int] = None,
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exports examination results to styled Excel (.xlsx) file with Kurdish UTF-8 support."""
    df = get_results_dataframe(exam_id, class_id, db)
    if df.empty:
        raise HTTPException(status_code=400, detail="هیچ ئەنجامێک نەدۆزرایەوە بۆ دەرهێنان")

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="ئەنجامەکان")
        
        # Adjust column widths & right-to-left alignment
        worksheet = writer.sheets["ئەنجامەکان"]
        worksheet.sheet_view.rightToLeft = True
        for col in worksheet.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = col[0].column_letter
            worksheet.column_dimensions[col_letter].width = max(max_len + 5, 14)

    output.seek(0)
    filename = f"omr_results_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    log_audit(db, "RESULTS_EXPORTED_XLSX", "Result", str(exam_id), current_user)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/csv")
def export_results_csv(
    exam_id: Optional[int] = None,
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exports examination results to UTF-8 BOM CSV file."""
    df = get_results_dataframe(exam_id, class_id, db)
    if df.empty:
        raise HTTPException(status_code=400, detail="هیچ ئەنجامێک نەدۆزرایەوە بۆ دەرهێنان")

    output = io.BytesIO()
    # Write with utf-8-sig for proper Excel/Windows Kurdish text display
    df.to_csv(output, index=False, encoding="utf-8-sig")
    output.seek(0)

    filename = f"omr_results_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    log_audit(db, "RESULTS_EXPORTED_CSV", "Result", str(exam_id), current_user)

    return StreamingResponse(
        output,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
