import shutil
import os

src = r"C:\Users\Administrator\.gemini\antigravity-ide\brain\ac129b0c-734d-4ddc-9fd0-a8f70efe3c51\.user_uploaded\media_1790779783086.jpg"

targets = [
    r"c:\Users\Administrator\Desktop\nows\frontend\public\logo.png",
    r"c:\Users\Administrator\Desktop\nows\frontend\public\logo.jpg",
    r"c:\Users\Administrator\Desktop\nows\frontend\public\ksc-logo.png",
    r"c:\Users\Administrator\Desktop\nows\frontend\public\favicon.png",
]

for t in targets:
    os.makedirs(os.path.dirname(t), exist_ok=True)
    shutil.copy(src, t)

print("ALL_LOGOS_COPIED_SUCCESSFULLY")
