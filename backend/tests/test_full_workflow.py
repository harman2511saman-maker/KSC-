"""
End-to-End Functional Test of Kurdish Sorani OMR Examination Platform.
Simulates complete teacher & student workflows:
1. Health & Database Check
2. List Exams and Answer Keys
3. Generate printable A4 OMR Sheet with QR and 4 corner registration markers
4. Simulate student taking exam and filling bubbles
5. Upload sheet to /api/scan/process-single
6. Check Results & Review details
7. Export results to XLSX & CSV
"""

import sys
import json
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import cv2
import numpy as np
import requests
from app.omr.template_definitions import generate_template_spec
from app.omr.sheet_generator import generate_omr_sheet_image, generate_omr_sheet_pdf

API_BASE = "http://127.0.0.1:8000/api"

def test_full_workflow():
    print("=== Step 1: Health & Database Check ===")
    s = requests.Session()
    res = s.get(f"{API_BASE}/health")
    assert res.status_code == 200
    health = res.json()
    print("Health Status:", health)
    assert health["status"] == "online"

    # Authenticate
    login_resp = s.post(f"{API_BASE}/auth/token", data={"username": "admin", "password": "Admin@Secure2026!"})
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    s.headers.update({"Authorization": f"Bearer {token}"})

    stats = s.get(f"{API_BASE}/results/dashboard-stats").json()
    print(f"Stats: {stats['total_students']} Students, {stats['total_exams']} Exams")

    print("\n=== Step 2: List Exams and Answer Keys ===")
    exams = s.get(f"{API_BASE}/exams/").json()
    assert len(exams) > 0
    exam = next((e for e in exams if e.get("answer_key_completed")), exams[0])
    print(f"Active Exam: ID={exam['id']}, Name='{exam['exam_name']}', Questions={exam['number_of_questions']}")

    answer_key_data = s.get(f"{API_BASE}/answer-keys/{exam['id']}").json()
    print(f"Answer Key Status: Complete={answer_key_data['is_complete']}, Filled={answer_key_data['filled_count']}")

    print("\n=== Step 3: Generate Printable A4 OMR Sheet ===")
    students = s.get(f"{API_BASE}/students/").json()
    student = students[0]
    print(f"Target Student: ID={student['id']}, Code='{student['student_id']}', Name='{student['name']}'")

    sheet_img = generate_omr_sheet_image(
        exam_data={
            "id": exam["id"],
            "exam_name": exam["exam_name"],
            "subject": exam["subject"],
            "grade": exam["grade"],
            "number_of_questions": exam["number_of_questions"],
            "choices": ["A", "B", "C", "D"],
            "template_version": "OMR-V1"
        },
        student_data={
            "id": student["id"],
            "name": student["name"],
            "student_id": student["student_id"]
        },
        sheet_id=f"OMR-EX{exam['id']}-STD{student['student_id']}"
    )
    img_bgr = cv2.cvtColor(np.array(sheet_img), cv2.COLOR_RGB2BGR)

    print("\n=== Step 4: Simulate Student Filling Answers on Paper ===")
    spec = generate_template_spec(exam["number_of_questions"], ["A", "B", "C", "D"], "OMR-V1")
    q_spec = spec["questions"]
    key_dict = {q["question_num"]: (q["correct_answer"] or "A") for q in answer_key_data["questions"]}

    # Fill Q1 to Q8 with correct answers
    for q_idx in range(1, 9):
        correct_c = key_dict.get(q_idx, "A")
        b = q_spec[q_idx]["bubbles"][correct_c]
        cv2.circle(img_bgr, (b["cx"], b["cy"]), b["inner_radius"], (15, 15, 15), -1)

    # Q9: Fill incorrect answer
    incorrect_c = "D" if key_dict.get(9) != "D" else "C"
    b9 = q_spec[9]["bubbles"][incorrect_c]
    cv2.circle(img_bgr, (b9["cx"], b9["cy"]), b9["inner_radius"], (15, 15, 15), -1)

    # Encode image to JPEG bytes
    _, img_encoded = cv2.imencode(".jpg", img_bgr)
    img_bytes = img_encoded.tobytes()

    print("\n=== Step 5: Upload Sheet to /api/scan/process-single ===")
    files = {"file": ("sheet_scan.jpg", img_bytes, "image/jpeg")}
    data = {"exam_id": exam["id"], "student_id": student["id"]}
    scan_resp = s.post(f"{API_BASE}/scan/process-single", files=files, data=data)
    assert scan_resp.status_code == 200
    scan_json = scan_resp.json()

    print("Scan API Message:", scan_json.get("message_ku"))
    print(f"Overall Status: {scan_json['data']['overall_status']}")
    print(f"Summary: Score={scan_json['data']['summary']['total_score']}, Percentage={scan_json['data']['summary']['percentage']}%")
    assert scan_json["success"] is True

    print("\n=== Step 6: Verify Results API and Exporting ===")
    results_list = s.get(f"{API_BASE}/results/?exam_id={exam['id']}").json()
    assert len(results_list) > 0
    print(f"Found {len(results_list)} stored results for Exam {exam['id']}")

    # Export to XLSX
    xlsx_res = s.get(f"{API_BASE}/export/xlsx?exam_id={exam['id']}")
    assert xlsx_res.status_code == 200
    print(f"XLSX Export Size: {len(xlsx_res.content)} bytes")
    assert len(xlsx_res.content) > 2000

    # Export to CSV
    csv_res = s.get(f"{API_BASE}/export/csv?exam_id={exam['id']}")
    assert csv_res.status_code == 200
    csv_text = csv_res.content.decode('utf-8-sig')
    print(f"CSV Header:\n{csv_text.splitlines()[0]}")
    assert "ڕیزبەندی" in csv_text
    assert "ناوی قوتابی" in csv_text

    print("\n[SUCCESS] COMPLETE END-TO-END WORKFLOW TEST COMPLETED PERFECTLY!")

if __name__ == "__main__":
    test_full_workflow()
