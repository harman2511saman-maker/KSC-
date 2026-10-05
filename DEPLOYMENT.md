# 🚀 ڕێبەری بڵاوکردنەوەی فەرمیی پڕۆژەی KSC (Deployment & Security Guide)

ئەم بەڵگەنامەیە هەنگاو بە هەنگاو ڕوونی دەکاتەوە چۆن تەواوی پڕۆژەکە (باکئێند و فرۆنتئێند) لەسەر سێرڤەری ڕاستەقینە بڵاوبکەیتەوە بە شێوازێکی زۆر پارێزراو و دژە-هاک.

---

## ١. بڵاوکردنەوە بە Docker (خێراترین و پارێزراوترین ڕێگا بۆ VPS)

ئەگەر سێرڤەرێکی تایبەتیت هەیە (وەک Ubuntu لە Hetzner, DigitalOcean, Linode, یان AWS):

### هەنگاوی ١: دابەزاندنی کۆدەکە لە سێرڤەر
```bash
git clone https://github.com/harman2511saman-maker/KSC-.git
cd KSC-
```

### هەنگاوی ٢: دروستکردنی فایلی نهێنی `.env`
```bash
cat << 'EOF' > .env
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
ENVIRONMENT=production
EOF
```

### هەنگاوی ٣: هەڵکردنی تەواوی سیستەمەکە بەیەک فەرمان
```bash
docker compose up -d --build
```
> پیرۆزە! سیستەمەکە لەسەر پۆڕتی `80` بە تەواوی ئۆتۆماتیکی هەڵکرا، بە پاراستنی تەواوی داتاکان لە ناو Volume پارێزراوەکانی دۆکەر.

---

## ٢. پاراستن بە Cloudflare (WAF, Anti-DDoS, و بڕوانامەی SSL)

بۆ ئەوەی داتاکان پارێزراو بن لە هێرش و کامێرای لایڤ لەسەر هەموو مۆبایلەکان بە `HTTPS` کاربکات:

1. دۆمەینەکەت (وەک `ksc.krd` یان `ksc-edu.com`) پەیوەست بکە بە **Cloudflare**.
2. لە بەشی DNS، تۆماری **A Record** دابنێ بە ئایپی سێرڤەرەکەت و دڵنیابە **Proxy status** لەسەر **Proxied (پرتەقاڵی)** بێت.
3. لە بەشی **SSL/TLS**، بژاردەی **Full (strict)** یان **Flexible** هەڵبژێرە.
4. لە بەشی **Security > WAF**، یاسای دژە-بۆت (Bot Fight Mode) چالاک بکە.

---

## ٣. بڵاوکردنەوە لەسەر هەوری بێبەرامبەر (Vercel + Render)

### بەشی فرۆنتئێند (Vercel):
1. بچۆ بۆ [vercel.com](https://vercel.com) و بە گیت‌هەب بچۆ ژوورەوە.
2. پڕۆژەی `harman2511saman-maker/KSC-` هەڵبژێرە.
3. لە بەشی **Root Directory** بنووسە: `frontend`.
4. لە **Environment Variables**:
   - `VITE_API_URL`: ناونیشانی باکئێندەکەت (بۆ نموونە: `https://ksc-backend.onrender.com`).
5. کلیک لەسەر **Deploy** بکە.

### بەشی باکئێند (Render.com):
1. بچۆ بۆ [render.com](https://render.com) > **New Web Service**.
2. گیت‌هەبەکەت پەیوەست بکە.
3. ڕێکخستنەکان:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. لە بەشی **Disk (Persistent Storage)**، دیسکێکی 1GB دروست بکە و بیگەیەنە بە `/app/data` بۆ پاراستنی داتابەیسی قوتابییان.

---

## ٤. پاشەکەوتی خۆکاری داتابەیس (Automated Daily Backups)

بۆ ئەوەی هیچ داتایەک لەدەست نەچێت، لە سێرڤەرەکەدا فەرمانی `crontab -e` بکەرەوە و ئەم دێڕە زیاد بکە تا هەموو شەوێک کاتژمێر ١٢ پاشەکەوتێک هەڵبگرێت:

```bash
0 0 * * * cp /app/data/omr_system.db /backups/omr_$(date +\%Y\%m\%d).db
```

---

## ٥. هێڵەکانی بەرگری و پاراستنی پڕۆژەکە (Security Highlights):
- ✅ **JWT Token Authentication:** تەنها ئەدمین بە وشەی تێپەڕی هاشکراوی (Bcrypt) دەتوانێت بچێتە بەشە سەرەکییەکان.
- ✅ **Secure Isolated SQLite / Postgres:** داتاکان لە دەرەوەی دەستی گشتی دەپارێزرێن.
- ✅ **CORS Domain Whitelist:** ڕێگری لە هەر ماڵپەڕێکی تر دەکات پەیوەندی بە سێرڤەرەکەتەوە بکات.
- ✅ **Input Sanitization & OpenCV Guard:** ڕێگری لە فایلی خراپەکاری دەکات.
