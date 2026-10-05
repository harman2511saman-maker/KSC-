import sys
import os
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash
from app.config import ADMIN_USERNAME, ADMIN_PASSWORD

db = SessionLocal()

# List existing users
print("Existing users:")
for u in db.query(User).all():
    print(f"- {u.id}: {u.username} (Role: {u.role})")

# Ensure Admin User exists with credentials from Environment variables
admin_user = db.query(User).filter(User.username == ADMIN_USERNAME).first()
if admin_user:
    admin_user.password_hash = get_password_hash(ADMIN_PASSWORD)
    admin_user.is_active = True
    admin_user.role = "ADMIN"
    print(f"Updated admin user: {ADMIN_USERNAME}")
else:
    admin_user = User(
        username=ADMIN_USERNAME,
        password_hash=get_password_hash(ADMIN_PASSWORD),
        full_name_ku="بەڕێوەبەری سەرەکی پلاتفۆرم",
        role="ADMIN",
        is_active=True
    )
    db.add(admin_user)
    print(f"Created admin user: {ADMIN_USERNAME}")

db.commit()
db.close()
print("DONE")
