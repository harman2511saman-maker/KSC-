import os
import json
import qrcode
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.omr.template_definitions import (
    CANONICAL_WIDTH,
    CANONICAL_HEIGHT,
    generate_template_spec
)

def get_font(size: int = 20, bold: bool = True) -> ImageFont.ImageFont:
    """Loads crisp TrueType font (Times / Arial / Tahoma) for international standard exam sheet."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fonts_dir = os.path.join(base_dir, "assets", "fonts")

    bundled_candidates = [
        os.path.join(fonts_dir, "timesbd.ttf" if bold else "times.ttf"),
        os.path.join(fonts_dir, "Tahoma-Bold.ttf" if bold else "Tahoma.ttf"),
        os.path.join(fonts_dir, "Arial-Bold.ttf"),
        os.path.join(fonts_dir, "SegoeUI-Bold.ttf"),
    ]

    for path in bundled_candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    try:
        return ImageFont.load_default(size=size)
    except Exception:
        return ImageFont.load_default()

def draw_text_left(draw: ImageDraw.Draw, x_left: int, y: int, text: str, font: ImageFont.ImageFont, fill: Any):
    """Draws left-aligned text."""
    draw.text((x_left, y), str(text), fill=fill, font=font)

def draw_text_right(draw: ImageDraw.Draw, x_right: int, y: int, text: str, font: ImageFont.ImageFont, fill: Any):
    """Draws right-aligned text."""
    s = str(text)
    bbox = draw.textbbox((0, 0), s, font=font)
    w = bbox[2] - bbox[0]
    draw.text((x_right - w, y), s, fill=fill, font=font)

def draw_text_center(draw: ImageDraw.Draw, x_center: int, y: int, text: str, font: ImageFont.ImageFont, fill: Any):
    """Draws centered text."""
    s = str(text)
    bbox = draw.textbbox((0, 0), s, font=font)
    w = bbox[2] - bbox[0]
    draw.text((x_center - (w / 2), y), s, fill=fill, font=font)

def generate_qr_image(payload_dict: Dict[str, Any], size: int = 150) -> Image.Image:
    """Generates high-contrast black and white QR code image."""
    qr_data = json.dumps(payload_dict, separators=(',', ':'))
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=5,
        border=2,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    return img.resize((size, size), Image.Resampling.NEAREST)

def generate_omr_sheet_image(
    exam_data: Dict[str, Any],
    student_data: Optional[Dict[str, Any]] = None,
    sheet_id: str = "SHEET-001",
    template_spec: Optional[Dict[str, Any]] = None
) -> Image.Image:
    """
    Renders an international standard A4 OMR examination sheet (1200 x 1700 px).
    Used for direct printing, visual preview, and scanning validation.
    """
    total_q = exam_data.get("number_of_questions", 50)
    choices = exam_data.get("choices", ["A", "B", "C", "D"])
    if isinstance(choices, str):
        choices = [c.strip() for c in choices.split(",") if c.strip()]
    template_version = exam_data.get("template_version", "OMR-V1")
    
    if template_spec is None:
        template_spec = generate_template_spec(total_q, choices, template_version)

    # Base white canvas
    img = Image.new("RGB", (CANONICAL_WIDTH, CANONICAL_HEIGHT), color=(255, 255, 255))
    
    # 0. Render Clean Monochrome Background Security Watermark (100% Pure Black & White)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    logo_candidates = [
        os.path.join(base_dir, "assets", "ksc_watermark.png"),
        os.path.join(base_dir, "assets", "ksc_watermark_clean.png"),
        os.path.join(os.path.dirname(base_dir), "frontend", "public", "ksc-watermark.png"),
        os.path.join(os.path.dirname(base_dir), "frontend", "public", "logo.png"),
        os.path.join(os.path.dirname(base_dir), "frontend", "public", "ksc-logo.png"),
    ]
    watermark_img = None
    for l_path in logo_candidates:
        if os.path.exists(l_path):
            try:
                watermark_img = Image.open(l_path)
                break
            except Exception:
                continue

    watermark_bw = None
    if watermark_img:
        try:
            # 1. Convert to pure 8-bit Grayscale (L) - guarantees zero color tint or RGB bias
            logo_gray = watermark_img.convert("L")
            
            # Extract alpha mask if present, otherwise extract from brightness
            if watermark_img.mode == "RGBA":
                logo_alpha = watermark_img.split()[-1]
            else:
                # Invert grayscale for clean alpha mask if background is white
                logo_alpha = Image.eval(logo_gray, lambda p: 255 if p < 250 else 0)

            # Build pure neutral monochrome RGBA (R=G=B strictly equal)
            watermark_bw = Image.merge("RGBA", (logo_gray, logo_gray, logo_gray, logo_alpha))

            # 2. Large background watermark (subtle, clean, neutral monochrome)
            wm_w = 700
            wm_h = int(wm_w * (watermark_bw.height / max(1, watermark_bw.width)))
            wm_resized = watermark_bw.resize((wm_w, wm_h), Image.Resampling.LANCZOS)
            
            gray_ch, _, _, a_ch = wm_resized.split()
            # Super light opacity (7%) to prevent any text overlay discoloration on physical printers
            a_subtle = a_ch.point(lambda p: int(p * 0.07))
            wm_subtle = Image.merge("RGBA", (gray_ch, gray_ch, gray_ch, a_subtle))

            wm_x = (CANONICAL_WIDTH - wm_w) // 2
            wm_y = 680
            img.paste(wm_subtle, (wm_x, wm_y), mask=wm_subtle)
        except Exception as e:
            print("Watermark paste error:", e)

    draw = ImageDraw.Draw(img)

    # Typography
    f_brand = get_font(size=25, bold=True)
    f_exam_title = get_font(size=23, bold=True)
    f_label_bold = get_font(size=19, bold=True)
    f_value = get_font(size=19, bold=False)
    f_inst_title = get_font(size=17, bold=True)
    f_inst_text = get_font(size=15, bold=False)
    f_inst_tag = get_font(size=14, bold=True)
    f_col_hdr = get_font(size=18, bold=True)
    f_q_num = get_font(size=21, bold=True)
    f_choice = get_font(size=17, bold=True)
    f_footer = get_font(size=14, bold=True)

    # 1. Registration Markers (Solid Black Squares in 4 Corners)
    for pos_key, (bx, by, bw, bh) in template_spec["marker_boxes"].items():
        draw.rectangle([bx, by, bx + bw, by + bh], fill=(0, 0, 0))

    # 2. Header Information Card (Crisp Black & White)
    header_x1, header_y1 = 120, 60
    header_x2, header_y2 = 910, 245
    
    # Header card outer border and background
    draw.rectangle([header_x1, header_y1, header_x2, header_y2], fill=(255, 255, 255), outline=(0, 0, 0), width=2)
    
    # Top banner bar inside header card (Light Grayscale)
    banner_h = 58
    draw.rectangle([header_x1 + 1, header_y1 + 1, header_x2 - 1, header_y1 + banner_h], fill=(240, 240, 240))
    draw.line([(header_x1, header_y1 + banner_h), (header_x2, header_y1 + banner_h)], fill=(180, 180, 180), width=2)

    # Header Crisp Black & White Logo
    brand_text_x = header_x1 + 20
    if watermark_bw:
        try:
            h_logo_size = 46
            h_logo_w = int(h_logo_size * (watermark_bw.width / max(1, watermark_bw.height)))
            h_logo = watermark_bw.resize((h_logo_w, h_logo_size), Image.Resampling.LANCZOS)
            h_logo_x = header_x1 + 14
            h_logo_y = header_y1 + 6
            img.paste(h_logo, (h_logo_x, h_logo_y), mask=h_logo)
            brand_text_x = h_logo_x + h_logo_w + 12
        except Exception:
            pass

    exam_title = exam_data.get("title") or exam_data.get("exam_name") or "EXAMINATION ANSWER SHEET"
    subject = exam_data.get("subject", "General Science")
    
    school_name = ""
    if student_data:
        school_name = student_data.get("school_name") or student_data.get("class_name") or ""
    if not school_name and exam_data:
        school_name = exam_data.get("school_name") or exam_data.get("class_name") or ""
    if not school_name:
        school_name = "____________________"

    draw_text_left(draw, brand_text_x, header_y1 + 14, "KSC OMR EXAMINATION", f_brand, (0, 0, 0))
    draw_text_right(draw, header_x2 - 20, header_y1 + 14, str(exam_title).upper(), f_exam_title, (0, 0, 0))

    # Metadata Row: Subject on Left, School on Right (Black text)
    meta_y = header_y1 + 72
    draw_text_left(draw, header_x1 + 20, meta_y, f"Subject: {subject}", f_label_bold, (0, 0, 0))
    draw_text_right(draw, header_x2 - 20, meta_y, f"Center / School: {school_name}", f_label_bold, (0, 0, 0))

    # Divider between metadata and student details
    draw.line([(header_x1, header_y1 + 118), (header_x2, header_y1 + 118)], fill=(200, 200, 200), width=1)

    # Student Info Row: Candidate Name on Left, Student ID on Right
    std_y = header_y1 + 134
    student_name = ""
    student_code = ""
    if student_data:
        student_name = student_data.get("full_name_kurdish") or student_data.get("name") or student_data.get("full_name") or ""
        student_code = student_data.get("student_id_number") or student_data.get("student_id") or ""

    if student_name:
        draw_text_left(draw, header_x1 + 20, std_y, f"Student Name: {student_name}", f_label_bold, (0, 0, 0))
    else:
        draw_text_left(draw, header_x1 + 20, std_y, "Student Name: ____________________________", f_label_bold, (0, 0, 0))

    if student_code:
        std_right_text = f"Student ID: {student_code}"
    else:
        std_right_text = "Student ID: ________________"
    draw_text_right(draw, header_x2 - 20, std_y, std_right_text, f_label_bold, (0, 0, 0))

    # 3. QR Code Card (Black & White)
    qr_payload = {
        "v": template_version,
        "e": exam_data.get("id", 1),
        "s": student_data.get("id") if student_data else None,
        "sid": sheet_id
    }
    qr_x, qr_y = template_spec["qr_region"]["x"], template_spec["qr_region"]["y"]
    qr_w, qr_h = template_spec["qr_region"]["w"], template_spec["qr_region"]["h"]
    
    # Frame for QR Box
    draw.rectangle([qr_x, qr_y, qr_x + qr_w, qr_y + qr_h], fill=(255, 255, 255), outline=(0, 0, 0), width=2)
    qr_img = generate_qr_image(qr_payload, size=qr_w - 14)
    img.paste(qr_img, (qr_x + 7, qr_y + 7))
    draw_text_center(draw, qr_x + (qr_w // 2), qr_y + qr_h + 10, "SHEET QR CODE", f_footer, (60, 60, 60))

    # 4. Instructions Box (Clean Grayscale)
    inst_y1 = 260
    inst_y2 = 345
    draw.rectangle([120, inst_y1, 1080, inst_y2], fill=(245, 245, 245), outline=(180, 180, 180), width=2)
    
    # Clean Full-Width Instructions (Pure Black)
    draw_text_left(draw, 145, inst_y1 + 14, "IMPORTANT EXAMINATION INSTRUCTIONS:", f_inst_title, (0, 0, 0))
    draw_text_left(draw, 145, inst_y1 + 40, "• Use a dark HB pencil or blue/black pen only to completely fill the appropriate circles.", f_inst_text, (20, 20, 20))
    draw_text_left(draw, 145, inst_y1 + 64, "• Fill each chosen circle completely and cleanly. Do not make stray marks, cross-outs, or fold this sheet.", f_inst_text, (20, 20, 20))

    # 5. Timing Marks (Solid Black)
    for (tx, ty, tw, th) in template_spec["timing_marks"]:
        draw.rectangle([tx, ty, tx + tw, ty + th], fill=(0, 0, 0))

    # 6. Column Cards & Bubble Grids (Crisp Black & White)
    questions = template_spec["questions"]
    col_layout = template_spec.get("col_layout", {})
    num_cols = col_layout.get("num_columns", max(q["column_idx"] for q in questions.values()) + 1)
    col_starts = col_layout.get("col_start_x", [120])
    col_width = col_layout.get("col_width", 465)
    grid_start_y = col_layout.get("grid_start_y", 445)
    row_height = col_layout.get("row_height", 44)
    questions_per_col = col_layout.get("questions_per_col", 25)

    header_bar_h = 42
    card_top_y = 365
    card_bottom_y = grid_start_y + (questions_per_col * row_height) - (row_height // 2) + 8

    for col in range(num_cols):
        col_x = col_starts[col] if col < len(col_starts) else 120
        col_qs = [q for q in questions.values() if q["column_idx"] == col]
        if not col_qs:
            continue
        
        # Column Card Outer Frame
        draw.rectangle([col_x, card_top_y, col_x + col_width, card_bottom_y], fill=None, outline=(180, 180, 180), width=2)
        
        # Pure Solid Black Column Header Bar
        draw.rectangle([col_x, card_top_y, col_x + col_width, card_top_y + header_bar_h], fill=(0, 0, 0))
        
        first_q = col_qs[0]
        # "Q#" Title centered above question number
        draw_text_center(draw, first_q["label_pos"][0], card_top_y + 10, "Q#", f_col_hdr, (255, 255, 255))
        
        # Choice labels (A, B, C, D) header perfectly centered above each bubble column
        for choice_key, b_info in first_q["bubbles"].items():
            draw_text_center(draw, b_info["cx"], card_top_y + 10, choice_key, f_col_hdr, (255, 255, 255))

        # Divider lines between rows
        for r_idx in range(len(col_qs)):
            row_y = grid_start_y + (r_idx * row_height)
            half_r = row_height // 2
            draw.line([(col_x + 6, row_y + half_r), (col_x + col_width - 6, row_y + half_r)], fill=(220, 220, 220), width=1)

    # Draw Question Numbers and Bubbles (High-contrast B&W)
    for q_num, q_info in questions.items():
        q_label_x, q_label_y = q_info["label_pos"]
        
        # Question Number badge / text
        draw_text_center(draw, q_label_x, q_label_y - 12, f"{q_num:02d}", f_q_num, (0, 0, 0))
        
        # Draw Each Bubble (Pure white fill with sharp black outline)
        for choice_key, b_info in q_info["bubbles"].items():
            bcx, bcy = b_info["cx"], b_info["cy"]
            r = b_info["radius"]
            
            # Crisp circular outline with clean white background
            draw.ellipse([bcx - r, bcy - r, bcx + r, bcy + r], fill=(255, 255, 255), outline=(0, 0, 0), width=2)
            # Watermark choice letter centered inside the bubble (light gray)
            draw_text_center(draw, bcx, bcy - 10, choice_key, f_choice, (200, 200, 200))

    # 7. Clean Monochrome Footer Bar
    footer_y = 1555
    footer_left = f"Template: {template_version} | Sheet ID: {sheet_id}"
    draw_text_left(draw, 120, footer_y, footer_left, f_footer, (80, 80, 80))
    draw_text_right(draw, 1080, footer_y, "KSC OMR Examination Platform", f_footer, (80, 80, 80))

    return img

def generate_omr_sheet_pdf(
    exam_data: Dict[str, Any],
    student_data: Optional[Dict[str, Any]] = None,
    sheet_id: str = "SHEET-001",
    output_path: Optional[str] = None
) -> bytes:
    """
    Generates a crisp, printable A4 PDF (210 x 297 mm) containing the canonical sheet.
    Preserves exact geometric scale, centered proportions, and safe printer margins.
    """
    img = generate_omr_sheet_image(exam_data, student_data, sheet_id)
    
    # Save image to temporary high-res buffer
    img_buffer = BytesIO()
    img.save(img_buffer, format="PNG", dpi=(300, 300))
    img_buffer.seek(0)
    
    pdf_buffer = BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=A4)
    a4_w, a4_h = A4
    
    # Calculate exact proportional scaling with safe margins to prevent crooked printer clipping
    from reportlab.lib.utils import ImageReader
    reader = ImageReader(img_buffer)
    
    img_aspect = CANONICAL_WIDTH / CANONICAL_HEIGHT
    margin = 8  # Safe physical printer margin in points (~2.8mm)
    avail_w = a4_w - (2 * margin)
    avail_h = a4_h - (2 * margin)
    
    if (avail_w / avail_h) > img_aspect:
        draw_h = avail_h
        draw_w = draw_h * img_aspect
    else:
        draw_w = avail_w
        draw_h = draw_w / img_aspect
        
    draw_x = (a4_w - draw_w) / 2.0
    draw_y = (a4_h - draw_h) / 2.0
    
    c.drawImage(reader, draw_x, draw_y, width=draw_w, height=draw_h, preserveAspectRatio=True, anchor='c')
    c.showPage()
    c.save()
    
    pdf_bytes = pdf_buffer.getvalue()
    if output_path:
        with open(output_path, "wb") as f:
            f.write(pdf_bytes)
            
    return pdf_bytes
