"""
PDF Parsing Service
Extracts text, tables, and metadata from PDF files
"""
import io
import logging
from typing import List, Dict, Any
import pdfplumber
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)


async def extract_text_from_pdf(file_bytes: bytes, max_pages: int = 50) -> str:
    """
    Extract text from PDF using pdfplumber
    
    Args:
        file_bytes: PDF file as bytes
        max_pages: Maximum pages to process (for free tier limits)
        
    Returns:
        Extracted text as string
    """
    try:
        text_content = []
        
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            total_pages = min(len(pdf.pages), max_pages)
            logger.info(f"Processing {total_pages} pages from PDF")
            
            for i, page in enumerate(pdf.pages[:max_pages]):
                page_text = page.extract_text()
                if page_text:
                    text_content.append(f"--- Page {i+1} ---\n{page_text}")
        
        return "\n\n".join(text_content)
        
    except Exception as e:
        logger.error(f"PDF text extraction failed: {str(e)}")
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")


async def extract_tables_from_pdf(file_bytes: bytes, max_pages: int = 50) -> List[Dict[str, Any]]:
    """
    Extract tables from PDF
    
    Args:
        file_bytes: PDF file as bytes
        max_pages: Maximum pages to process
        
    Returns:
        List of tables with page numbers and data
    """
    try:
        tables_data = []
        
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for i, page in enumerate(pdf.pages[:max_pages]):
                tables = page.extract_tables()
                
                for table_idx, table in enumerate(tables):
                    if table:
                        tables_data.append({
                            "page": i + 1,
                            "table_index": table_idx,
                            "rows": len(table),
                            "columns": len(table[0]) if table else 0,
                            "data": table
                        })
        
        logger.info(f"Extracted {len(tables_data)} tables from PDF")
        return tables_data
        
    except Exception as e:
        logger.error(f"PDF table extraction failed: {str(e)}")
        return []


async def extract_pdf_metadata(file_bytes: bytes) -> Dict[str, Any]:
    """
    Extract PDF metadata using PyMuPDF
    
    Args:
        file_bytes: PDF file as bytes
        
    Returns:
        Dictionary with metadata
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        
        metadata = {
            "page_count": doc.page_count,
            "title": doc.metadata.get("title", ""),
            "author": doc.metadata.get("author", ""),
            "subject": doc.metadata.get("subject", ""),
            "creator": doc.metadata.get("creator", ""),
            "producer": doc.metadata.get("producer", ""),
            "creation_date": doc.metadata.get("creationDate", ""),
            "modification_date": doc.metadata.get("modDate", ""),
        }
        
        doc.close()
        return metadata
        
    except Exception as e:
        logger.error(f"PDF metadata extraction failed: {str(e)}")
        return {"page_count": 0, "error": str(e)}


async def chunk_pdf_text(text: str, chunk_size: int = 3000, overlap: int = 200) -> List[str]:
    """
    Split PDF text into chunks for LLM processing
    
    Args:
        text: Full text content
        chunk_size: Maximum characters per chunk
        overlap: Overlap between chunks
        
    Returns:
        List of text chunks
    """
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        
        # Try to break at sentence boundary
        if end < len(text):
            # Look for period followed by space
            last_period = text.rfind(". ", start, end)
            if last_period > start + chunk_size // 2:
                end = last_period + 1
        
        chunks.append(text[start:end])
        start = end - overlap
    
    logger.info(f"Split text into {len(chunks)} chunks")
    return chunks


async def extract_images_from_pdf(file_bytes: bytes, max_images: int = 10) -> List[Dict[str, Any]]:
    """
    Extract images from PDF
    
    Args:
        file_bytes: PDF file as bytes
        max_images: Maximum images to extract
        
    Returns:
        List of image data with metadata
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        images = []
        
        for page_num in range(doc.page_count):
            page = doc[page_num]
            image_list = page.get_images()
            
            for img_idx, img in enumerate(image_list):
                if len(images) >= max_images:
                    break
                    
                xref = img[0]
                base_image = doc.extract_image(xref)
                
                images.append({
                    "page": page_num + 1,
                    "index": img_idx,
                    "width": base_image["width"],
                    "height": base_image["height"],
                    "ext": base_image["ext"],
                    "image_bytes": base_image["image"]
                })
        
        doc.close()
        logger.info(f"Extracted {len(images)} images from PDF")
        return images
        
    except Exception as e:
        logger.error(f"PDF image extraction failed: {str(e)}")
        return []
