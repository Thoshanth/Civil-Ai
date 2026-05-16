"""
Tender Document Analyzer Router
Extracts key information from tender PDFs
"""
import json
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.llm_chain import call_llm
from app.services.pdf_parser import extract_text_from_pdf, chunk_pdf_text
from app.models.schemas import LLMResponse, TenderAnalysisResult

router = APIRouter()
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert in analyzing Indian government tender documents (CPWD, PWD, NHAI, NIT formats).

CRITICAL INSTRUCTIONS:
1. Extract ONLY information explicitly stated in the tender document
2. Do NOT estimate or calculate values not provided
3. Copy dates, amounts, and requirements exactly as written
4. If information is not found, set field to null or empty list
5. Do not make assumptions about eligibility criteria

Analyze the tender document and return JSON:
{
  "project_name": "Construction of 2-lane road from X to Y",
  "tender_value_inr": 50000000.0,
  "key_dates": [
    {"event": "Last date for submission", "date": "2024-06-15", "days_remaining": 25},
    {"event": "Technical bid opening", "date": "2024-06-16", "days_remaining": 26},
    {"event": "Site visit", "date": "2024-05-28", "days_remaining": 8}
  ],
  "eligibility_criteria": [
    {
      "criterion": "Annual turnover",
      "requirement": "Minimum ₹2 crore in last 3 years",
      "is_critical": true
    },
    {
      "criterion": "Similar work experience",
      "requirement": "Completed at least 2 road projects of ₹1 crore+ in last 7 years",
      "is_critical": true
    }
  ],
  "scope_summary": "Construction of 5 km 2-lane bituminous road with drainage, culverts, and road furniture. Includes earthwork, sub-base, base course, and wearing course.",
  "risk_clauses": [
    "Liquidated damages: 0.5% per week up to 10% of contract value",
    "Price escalation limited to 5% only",
    "Contractor responsible for all statutory clearances"
  ],
  "compliance_checklist": [
    "EMD: ₹10 lakhs (bank guarantee or DD)",
    "PAN card and GST registration mandatory",
    "Class-I contractor registration required",
    "Submit audited financial statements for 3 years"
  ]
}

EXTRACTION GUIDELINES:
- Project name: Look for "Project Name", "Work Description", "Title"
- Tender value: "Estimated Cost", "Contract Value", "Project Cost"
- Dates: Extract all dates mentioned - submission deadline, bid opening, site visit
- Eligibility: Look for "Eligibility Criteria", "Qualification Requirements", "Pre-qualification"
- Scope: Extract from "Scope of Work", "Work Description", "Bill of Quantities"
- Risks: Look for "Liquidated Damages", "Penalties", "Escalation Clause", "Payment Terms"
- Compliance: "EMD", "Earnest Money", "Documents Required", "Submission Requirements"

VALIDATION:
- Extract dates in YYYY-MM-DD format if possible
- Extract monetary values as numbers (convert crores/lakhs to rupees)
- Mark eligibility criteria as critical if they are mandatory
- Copy risk clauses verbatim from document

Return ONLY valid JSON. No explanation outside the JSON.
"""


@router.post("/analyze", response_model=LLMResponse)
async def analyze_tender(file: UploadFile = File(...)):
    """
    Analyze tender document PDF
    
    Args:
        file: Tender PDF (NIT/RFQ/BOQ)
        
    Returns:
        Structured tender analysis with key information
    """
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read file
        file_bytes = await file.read()
        logger.info(f"Processing tender document: {file.filename} ({len(file_bytes)} bytes)")
        
        # Extract text from PDF
        text_content = await extract_text_from_pdf(file_bytes, max_pages=100)
        
        if not text_content or len(text_content) < 200:
            raise HTTPException(
                status_code=400,
                detail="Could not extract sufficient text from PDF"
            )
        
        # For large tenders, chunk the text
        if len(text_content) > 8000:
            logger.info("Large tender document - using chunking strategy")
            chunks = await chunk_pdf_text(text_content, chunk_size=6000, overlap=500)
            
            # Analyze first 3 chunks (usually contain key info)
            all_results = []
            for i, chunk in enumerate(chunks[:3]):
                logger.info(f"Analyzing chunk {i+1}/{min(3, len(chunks))}")
                
                user_message = f"""Analyze this section of the tender document.

IMPORTANT: Extract ONLY information explicitly stated in the text below. Do not estimate or assume.

{chunk}

Extract:
1. Project name and estimated value (if mentioned)
2. All dates with events
3. Eligibility criteria (copy exact requirements)
4. Scope of work description
5. Risk clauses (penalties, escalation, payment terms)
6. Compliance requirements (EMD, documents, registrations)

If any information is not found in this section, set it to null or empty list.
"""
                
                result_text, provider = await call_llm(
                    system_prompt=SYSTEM_PROMPT,
                    user_message=user_message,
                    max_tokens=2500,
                    temperature=0.2
                )
                
                try:
                    chunk_result = json.loads(result_text)
                    all_results.append(chunk_result)
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse chunk {i+1} result")
                    continue
            
            # Merge results from multiple chunks
            merged_result = _merge_tender_results(all_results)
            validated_result = TenderAnalysisResult(**merged_result)
            
            return LLMResponse(
                success=True,
                data=validated_result.model_dump(),
                llm_provider=provider
            )
        
        else:
            # Small tender - analyze in one go
            user_message = f"""Analyze this tender document.

IMPORTANT: Extract ONLY information explicitly stated in the document. Do not estimate or assume values.

{text_content[:10000]}

Extract all key information:
1. Project name and tender value
2. All dates (submission deadline, bid opening, site visit, etc.)
3. Eligibility criteria with exact requirements
4. Scope of work summary
5. Risk clauses (copy verbatim)
6. Compliance checklist for bid submission

If any information is not found, set it to null or empty list.
"""
            
            result_text, provider = await call_llm(
                system_prompt=SYSTEM_PROMPT,
                user_message=user_message,
                max_tokens=2500,
                temperature=0.2
            )
            
            try:
                result_data = json.loads(result_text)
                validated_result = TenderAnalysisResult(**result_data)
                
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
        logger.error(f"Tender analysis failed: {str(e)}")
        return LLMResponse(
            success=False,
            error=str(e)
        )


def _merge_tender_results(results: list) -> dict:
    """Merge results from multiple chunks"""
    if not results:
        raise ValueError("No results to merge")
    
    if len(results) == 1:
        return results[0]
    
    # Take project name and value from first result
    merged = {
        "project_name": results[0].get("project_name", ""),
        "tender_value_inr": results[0].get("tender_value_inr"),
        "key_dates": [],
        "eligibility_criteria": [],
        "scope_summary": "",
        "risk_clauses": [],
        "compliance_checklist": []
    }
    
    # Merge lists from all chunks
    for result in results:
        merged["key_dates"].extend(result.get("key_dates", []))
        merged["eligibility_criteria"].extend(result.get("eligibility_criteria", []))
        merged["risk_clauses"].extend(result.get("risk_clauses", []))
        merged["compliance_checklist"].extend(result.get("compliance_checklist", []))
        
        # Concatenate scope summaries
        if result.get("scope_summary"):
            merged["scope_summary"] += " " + result["scope_summary"]
    
    # Remove duplicates
    merged["key_dates"] = _deduplicate_list(merged["key_dates"], key="event")
    merged["eligibility_criteria"] = _deduplicate_list(merged["eligibility_criteria"], key="criterion")
    merged["risk_clauses"] = list(set(merged["risk_clauses"]))
    merged["compliance_checklist"] = list(set(merged["compliance_checklist"]))
    
    return merged


def _deduplicate_list(items: list, key: str) -> list:
    """Remove duplicates from list of dicts based on key"""
    seen = set()
    unique = []
    for item in items:
        if isinstance(item, dict):
            value = item.get(key)
            if value and value not in seen:
                seen.add(value)
                unique.append(item)
        else:
            if item not in seen:
                seen.add(item)
                unique.append(item)
    return unique


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "module": "tender"}
