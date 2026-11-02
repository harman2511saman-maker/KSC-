"""
KSC Grade 12 Quiz Test Data Cleaner.
Deletes all test student progress, test leaderboards, and dummy questions.
"""
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_FILE = BASE_DIR / "data" / "omr_system.db"
UPLOADS_QUIZ_DIR = BASE_DIR / "data" / "uploads" / "quiz"

def reset_all_test_data():
    print("=" * 60)
    print("KSC Grade 12 Quiz - Wiping All Test Data")
    print("=" * 60)
    
    # Check all possible database locations
    candidates = [
        DB_FILE,
        BASE_DIR / "omr_system.db",
        BASE_DIR / "backend" / "data" / "omr_system.db",
        BASE_DIR.parent / "backend" / "data" / "omr_system.db"
    ]
    
    found_any = False
    for db_path in candidates:
        if db_path.exists():
            found_any = True
            print(f"Opening database: {db_path}")
            conn = sqlite3.connect(str(db_path))
            cur = conn.cursor()
            
            try:
                cur.execute("DELETE FROM quiz_progress")
                print(f"  ✓ Deleted {cur.rowcount} rows from quiz_progress")
            except Exception as e:
                print(f"  - quiz_progress: {e}")
                
            try:
                cur.execute("DELETE FROM quiz_questions")
                print(f"  ✓ Deleted {cur.rowcount} rows from quiz_questions")
            except Exception as e:
                print(f"  - quiz_questions: {e}")
                
            conn.commit()
            conn.close()

    # Clean quiz uploads directory
    if UPLOADS_QUIZ_DIR.exists():
        del_files = 0
        for f in UPLOADS_QUIZ_DIR.glob("*.*"):
            if f.is_file():
                try:
                    f.unlink()
                    del_files += 1
                except Exception:
                    pass
        print(f"  ✓ Removed {del_files} uploaded test quiz images.")

    print("\nAll test quiz data wiped successfully.")
    print("=" * 60)

if __name__ == "__main__":
    reset_all_test_data()
