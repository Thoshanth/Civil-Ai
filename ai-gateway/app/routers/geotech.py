"""
Geotechnical Report Analysis Router
Analyzes borehole logs and soil investigation reports
"""
import json
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.llm_chain import call_llm
from app.services.pdf_parser import extract_text_from_pdf, extract_tables_from_pdf
from app.models.schemas import LLMResponse, GeotechAnalysisResult

router = APIRouter()
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a geotechnical engineering expert analyzing soil investigation reports. Your task is to EXTRACT data from the provided document, NOT to calculate or estimate values.

CRITICAL INSTRUCTIONS:
1. Extract ONLY values explicitly stated in the document
2. Do NOT calculate bearing capacity unless it's already calculated in the report
3. Do NOT estimate SPT values - extract them from borehole logs
4. If a value is not found in the document, set it to null
5. Copy soil descriptions verbatim from the report
6. Extract depth ranges exactly as stated

Return a JSON object with this structure:
{
  "soil_layers": [
    {
      "depth_m": 0.0,
      "soil_type": "Silty Clay",
      "spt_n_value": 8,
      "description": "Brown silty clay with medium plasticity (exact text from report)"
    }
  ],
  "bearing_capacity": {
    "shallow_kPa": 150.0,  // ONLY if stated in report, else null
    "pile_kN": 450.0        // ONLY if stated in report, else null
  },
  "groundwater_depth_m": 3.5,  // ONLY if stated in report, else null
  "foundation_recommendation": "Copy exact recommendation from report",
  "risk_flags": [
    "Copy exact risk statements from report"
  ],
  "is_code_references": [
    "List IS codes mentioned in report"
  ]
}

EXTRACTION GUIDELINES:
- Look for sections titled: "Soil Profile", "Borehole Log", "SPT Results", "Soil Description"
- SPT N-values are usually in format: "N = 12" or "SPT: 15" or "N-value: 20"
- Depth ranges: "0-2m", "Depth 2.0m to 5.0m", "From 0.0m to 3.0m"
- Groundwater: "GWT at 3.5m", "Water table encountered at", "Water level"
- Bearing capacity: Look for "SBC", "Safe Bearing Capacity", "Allowable bearing pressure"
- Soil classification: Use IS classification if mentioned (CI, CL, SC, SM, etc.)

VALIDATION:
- If you extract a bearing capacity value, it should be explicitly stated in the report
- If you extract SPT values, they should be from actual test results
- Do not use typical values or engineering judgment - extract only

Return ONLY valid JSON. No explanation outside the JSON.
"""


@router.post("/analyze", response_model=LLMResponse)
async def analyze_geotech_report(file: UploadFile = File(...)):
    """
    Analyze geotechnical/borehole report PDF
    
    Args:
        file: PDF file containing soil investigation report
        
    Returns:
        Structured geotechnical analysis with recommendations
    """
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read file
        file_bytes = await file.read()
        logger.info(f"Processing geotechnical report: {file.filename} ({len(file_bytes)} bytes)")
        
        # Extract text from PDF
        text_content = await extract_text_from_pdf(file_bytes, max_pages=30)
        
        if not text_content or len(text_content) < 100:
            raise HTTPException(
                status_code=400,
                detail="Could not extract sufficient text from PDF. Please ensure it's a text-based PDF."
            )
        
        # Extract tables (for SPT data, lab test results)
        tables = await extract_tables_from_pdf(file_bytes, max_pages=30)
        
        # Prepare user message
        user_message = f"""Extract geotechnical data from this soil investigation report.

IMPORTANT: Extract ONLY the values that are explicitly stated in the document below. Do NOT calculate, estimate, or use typical values.

TEXT CONTENT:
{text_content[:8000]}

"""
        
        if tables:
            user_message += f"\nEXTRACTED TABLES: {len(tables)} tables found\n"
            user_message += "These tables may contain SPT values, depth ranges, and test results:\n\n"
            # Include first few tables
            for i, table in enumerate(tables[:3]):
                user_message += f"\nTable {i+1} (Page {table['page']}):\n"
                user_message += str(table['data'][:10])  # First 10 rows
        
        user_message += """

EXTRACTION CHECKLIST:
1. Soil layers: Extract depth range, soil type, SPT N-value, and description from borehole log
2. Bearing capacity: Extract ONLY if explicitly calculated in the report (look for "SBC", "Safe Bearing Capacity")
3. Groundwater: Extract depth if mentioned (look for "GWT", "Water table", "Water level")
4. Recommendations: Copy verbatim from "Recommendations" or "Conclusions" section
5. Risks: Copy any warnings or risk statements from the report
6. IS Codes: List any IS codes referenced in the document

If any value is not found in the document, set it to null. Do not estimate or calculate.
"""
        
        # Call LLM
        result_text, provider = await call_llm(
            system_prompt=SYSTEM_PROMPT,
            user_message=user_message,
            max_tokens=2048,
            temperature=0.2
        )
        
        # Parse JSON response
        try:
            result_data = json.loads(result_text)
            # Validate against schema
            validated_result = GeotechAnalysisResult(**result_data)
            
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
        logger.error(f"Geotechnical analysis failed: {str(e)}")
        return LLMResponse(
            success=False,
            error=str(e)
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "module": "geotechnical"}
