"""
Bill of Quantities (BOQ) Analysis Router
Extracts quantities and estimates costs from drawings/BOQ sheets
"""
import json
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.services.llm_chain import call_llm
from app.services.pdf_parser import extract_text_from_pdf, extract_tables_from_pdf
from app.models.schemas import LLMResponse, BOQAnalysisResult

router = APIRouter()
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a quantity surveyor specializing in Indian civil construction with expertise in CPWD DSR 2023 rates.

CRITICAL INSTRUCTIONS:
1. Extract ONLY work items explicitly mentioned in the document or description
2. Do NOT add items that are not mentioned
3. Use CPWD DSR 2023 rates - if you don't know the exact rate, use approximate market rates
4. Calculate amount = quantity × rate accurately
5. If quantities are not specified, you may estimate based on project description

Given the project description, drawing data, or BOQ sheet, extract a Bill of Quantities as JSON:
{
  "items": [
    {
      "item_no": "1",
      "description": "Earthwork in excavation in foundation trenches in all types of soil",
      "unit": "cum",
      "quantity": 150.0,
      "cpwd_rate_inr": 180.50,
      "amount_inr": 27075.0
    },
    {
      "item_no": "2",
      "description": "Plain cement concrete 1:3:6 in foundation",
      "unit": "cum",
      "quantity": 45.0,
      "cpwd_rate_inr": 5200.00,
      "amount_inr": 234000.0
    }
  ],
  "total_amount_inr": 261075.0,
  "notes": "Rates as per CPWD DSR 2023. GST extra. Quantities extracted from document.",
  "summary": "Foundation work for residential building - 2 items totaling ₹2.61 lakhs"
}

EXTRACTION GUIDELINES:
- For PDF/drawings: Extract items from BOQ tables or work descriptions
- For text descriptions: List only the work items mentioned
- Standard units: cum (cubic meter), sqm (square meter), rmt (running meter), kg, tonne, nos (numbers)
- Use standard CPWD item descriptions
- Calculate amount = quantity × rate for each item
- Sum all amounts for total

CPWD DSR 2023 APPROXIMATE RATES (use these as reference):
- Earthwork excavation: ₹180-220/cum
- PCC 1:4:8: ₹5,200-5,500/cum
- RCC M20: ₹6,500-7,000/cum
- RCC M25: ₹6,800-7,200/cum
- RCC M30: ₹7,200-7,500/cum
- Brick masonry 230mm in CM 1:6: ₹580-650/sqm
- Plastering 12mm thick: ₹180-220/sqm
- Vitrified tiles 600x600mm: ₹850-950/sqm
- Painting (distemper): ₹65-85/sqm
- Steel reinforcement: ₹65,000-72,000/tonne

Return ONLY valid JSON. No explanation outside the JSON.
"""


@router.post("/analyze", response_model=LLMResponse)
async def analyze_boq(
    file: Optional[UploadFile] = File(None),
    description: Optional[str] = Form(None)
):
    """
    Analyze BOQ from PDF or text description
    
    Args:
        file: PDF file (drawing or BOQ sheet)
        description: Text description of work items
        
    Returns:
        Structured BOQ with quantities and rates
    """
    try:
        user_message = ""
        
        # Process file if provided
        if file:
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail="Only PDF files are supported")
            
            file_bytes = await file.read()
            logger.info(f"Processing BOQ file: {file.filename} ({len(file_bytes)} bytes)")
            
            # Extract text
            text_content = await extract_text_from_pdf(file_bytes, max_pages=50)
            
            # Extract tables (BOQ sheets often have tables)
            tables = await extract_tables_from_pdf(file_bytes, max_pages=50)
            
            user_message = f"""Extract Bill of Quantities from this document.

IMPORTANT: Extract ONLY the items present in the document. Do not add items not mentioned.

TEXT CONTENT:
{text_content[:10000]}

"""
            
            if tables:
                user_message += f"\nEXTRACTED TABLES: {len(tables)} tables found\n"
                user_message += "BOQ data is likely in these tables:\n\n"
                for i, table in enumerate(tables[:5]):
                    user_message += f"\nTable {i+1} (Page {table['page']}, {table['rows']}x{table['columns']}):\n"
                    # Include table data
                    for row in table['data'][:15]:  # First 15 rows
                        user_message += str(row) + "\n"
            
            user_message += """

EXTRACTION CHECKLIST:
1. Item numbers and descriptions from the document
2. Quantities with correct units
3. Rates (if mentioned) or apply CPWD DSR 2023 rates
4. Calculate amounts accurately
5. Sum total amount

Do not add items that are not in the document.
"""
        
        # Process text description if provided
        elif description:
            user_message = f"""Create a Bill of Quantities for this project.

IMPORTANT: Create BOQ items ONLY for the work items mentioned below. Do not add extra items.

PROJECT DESCRIPTION:
{description}

Extract or estimate quantities for the mentioned work items and apply CPWD DSR 2023 rates.
List each item with: item number, description, unit, quantity, rate, and amount.
"""
        
        else:
            raise HTTPException(
                status_code=400,
                detail="Either file or description must be provided"
            )
        
        # Call LLM
        result_text, provider = await call_llm(
            system_prompt=SYSTEM_PROMPT,
            user_message=user_message,
            max_tokens=3000,
            temperature=0.2
        )
        
        # Parse JSON response
        try:
            result_data = json.loads(result_text)
            validated_result = BOQAnalysisResult(**result_data)
            
            return LLMResponse(
                success=True,
                data=validated_result.model_dump(),
                llm_provider=provider
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {str(e)}")
            logger.error(f"Raw response: {result_text[:500]}")
            raise HTTPException(
                status_code=500,
                detail="LLM returned invalid JSON. Please try again."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"BOQ analysis failed: {str(e)}")
        return LLMResponse(
            success=False,
            error=str(e)
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "module": "boq"}
