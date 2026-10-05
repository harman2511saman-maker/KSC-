"""
OMR Computer Vision Package.
"""
from app.omr.template_definitions import generate_template_spec, DEFAULT_OMR_V1_SPEC
from app.omr.sheet_generator import generate_omr_sheet_image, generate_omr_sheet_pdf
from app.omr.image_quality import evaluate_image_quality
from app.omr.marker_detector import detect_registration_markers
from app.omr.perspective_corrector import warp_to_canonical
from app.omr.qr_processor import decode_qr_code
from app.omr.bubble_classifier import classify_question_answers
from app.omr.debug_visualizer import generate_debug_overlay
from app.omr.pdf_processor import extract_images_from_pdf, get_pdf_page_count
from app.omr.omr_pipeline import process_omr_sheet
