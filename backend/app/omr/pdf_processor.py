"""
Multi-page PDF Streaming and Page Image Extractor.
Extracts individual pages from PDF documents efficiently without loading entire documents into RAM.
Converts pages into high-resolution NumPy arrays for OMR processing.
"""

import os
from typing import Generator, Tuple, Optional, List
import numpy as np
from PIL import Image

try:
    import pypdfium2 as pdfium
    HAS_PDFIUM = True
except ImportError:
    HAS_PDFIUM = False

def extract_images_from_pdf(
    pdf_path_or_bytes: bytes | str,
    target_dpi: int = 150
) -> Generator[Tuple[int, np.ndarray], None, None]:
    """
    Yields (page_index, image_bgr_numpy) for each page in the PDF.
    Uses pypdfium2 for high-speed, faithful rendering.
    """
    if not HAS_PDFIUM:
        raise RuntimeError("pypdfium2 is required for PDF page extraction")

    pdf = pdfium.PdfDocument(pdf_path_or_bytes)
    total_pages = len(pdf)
    
    # Scale factor for 150 DPI (standard 72 DPI base -> 150/72 ≈ 2.083)
    scale = target_dpi / 72.0

    for page_idx in range(total_pages):
        page = pdf[page_idx]
        bitmap = page.render(scale=scale)
        pil_image = bitmap.to_pil()
        
        # Convert PIL to BGR OpenCV format
        rgb_arr = np.array(pil_image)
        if len(rgb_arr.shape) == 2:
            bgr_arr = rgb_arr
        elif rgb_arr.shape[2] == 4:  # RGBA
            rgb_arr = rgb_arr[:, :, :3]
            bgr_arr = rgb_arr[:, :, ::-1]  # RGB to BGR
        else:
            bgr_arr = rgb_arr[:, :, ::-1]

        yield page_idx + 1, bgr_arr

def get_pdf_page_count(pdf_path_or_bytes: bytes | str) -> int:
    """Returns total number of pages in the PDF document."""
    if not HAS_PDFIUM:
        return 1
    pdf = pdfium.PdfDocument(pdf_path_or_bytes)
    return len(pdf)
