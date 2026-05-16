"""
IS Code Compliance Checker Router
Verifies design compliance with Indian Standard codes
"""
import json
import logging
from fastapi import APIRouter, HTTPException
from app.services.llm_chain import call_llm
from app.services.vector_store import search_is_codes, initialize_is_code_store
from app.models.schemas import LLMResponse, ISCodeComplianceResult, ISCodeCheckRequest

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize IS Code vector store on startup
initialize_is_code_store()

SYSTEM_PROMPT = """You are an expert on Indian Standard codes for civil engineering (IS 456, IS 800, IS 1893, IS 875, IS 2911, IS 1904).

Given the structural/geotechnical design parameters and relevant IS Code clauses, check compliance and return:
{
  "overall_status": "COMPLIANT",
  "checks": [
    {
      "clause": "IS 456:2000 Cl. 26.5.2.1",
      "description": "Minimum reinforcement in beams",
      "status": "PASS",
      "provided_value": "0.24% (300mm² in 300x500 beam)",
      "required_value": "0.20% minimum (0.85bd/fy)",
      "remarks": "Provided reinforcement exceeds minimum requirement"
    },
    {
      "clause": "IS 456:2000 Cl. 26.5.1.5",
      "description": "Maximum spacing of stirrups",
      "status": "FAIL",
      "provided_value": "350mm",
      "required_value": "300mm maximum (0.75d or 300mm)",
      "remarks": "Spacing exceeds maximum limit. Reduce to 300mm."
    }
  ],
  "recommendations": [
    "Reduce stirrup spacing from 350mm to 300mm in all beams",
    "Consider using Fe 500 steel to reduce reinforcement congestion"
  ]
}

Status values: PASS, FAIL, WARNING
Overall status: COMPLIANT (all pass), NON_COMPLIANT (any fail), NEEDS_REVIEW (warnings only)

Return ONLY valid JSON. No explanation outside the JSON.
"""


@router.post("/check", response_model=LLMResponse)
async def check_is_code_compliance(request: ISCodeCheckRequest):
    """
    Check design compliance with IS Codes
    
    Args:
        request: Design parameters and codes to check
        
    Returns:
        Compliance status with clause-by-clause checks
    """
    try:
        logger.info(f"Checking IS Code compliance for {request.design_type}")
        
        # Search relevant IS Code clauses using RAG
        search_query = f"{request.design_type} design {' '.join(request.parameters.keys())}"
        relevant_codes = search_is_codes(search_query, top_k=5)
        
        # Prepare context from retrieved codes
        code_context = "\n\n".join([
            f"**{code['code']}**: {code['text']}"
            for code in relevant_codes
        ])
        
        # Prepare user message
        user_message = f"""Check compliance for this {request.design_type} design:

DESIGN PARAMETERS:
{json.dumps(request.parameters, indent=2)}

RELEVANT IS CODE CLAUSES:
{code_context}

"""
        
        if request.codes_to_check:
            user_message += f"\nSpecifically check: {', '.join(request.codes_to_check)}\n"
        
        user_message += """
Perform detailed compliance checks for each relevant clause.
Flag any violations or warnings.
Provide specific recommendations for non-compliant items.
"""
        
        # Call LLM
        result_text, provider = await call_llm(
            system_prompt=SYSTEM_PROMPT,
            user_message=user_message,
            max_tokens=2500,
            temperature=0.1  # Low temperature for deterministic compliance checks
        )
        
        # Parse JSON response
        try:
            result_data = json.loads(result_text)
            validated_result = ISCodeComplianceResult(**result_data)
            
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
        logger.error(f"IS Code compliance check failed: {str(e)}")
        return LLMResponse(
            success=False,
            error=str(e)
        )


@router.post("/query", response_model=LLMResponse)
async def query_is_code(request: dict):
    """
    Simple IS Code query endpoint (for backend compatibility)
    
    Args:
        request: Dict with 'query' and optional 'projectId'
        
    Returns:
        Answer based on IS Code database
    """
    try:
        query = request.get("query", "")
        if not query:
            raise HTTPException(status_code=400, detail="Query is required")
        
        logger.info(f"IS Code query: {query}")
        
        # Search IS Code database
        relevant_codes = search_is_codes(query, top_k=5)
        
        # Prepare context
        code_context = "\n\n".join([
            f"**{code['code']}** - {code.get('title', 'N/A')}\n{code['text']}"
            for code in relevant_codes
        ])
        
        # Simple prompt for answering questions
        system_prompt = """You are an expert on Indian Standard codes for civil engineering.
Answer the user's question based on the provided IS Code clauses.
Provide a clear, concise answer with relevant code references.
Return JSON: {"answer": "your answer here", "references": ["IS 456:2000 Cl. X.X", ...]}
"""
        
        user_message = f"""Question: {query}

RELEVANT IS CODE CLAUSES:
{code_context}

Answer the question based on these clauses.
"""
        
        # Call LLM
        result_text, provider = await call_llm(
            system_prompt=system_prompt,
            user_message=user_message,
            max_tokens=1500,
            temperature=0.2
        )
        
        # Parse response
        try:
            result_data = json.loads(result_text)
            return LLMResponse(
                success=True,
                data=result_data,
                llm_provider=provider
            )
        except json.JSONDecodeError:
            # If JSON parsing fails, return as plain text
            return LLMResponse(
                success=True,
                data={"answer": result_text, "references": []},
                llm_provider=provider
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"IS Code query failed: {str(e)}")
        return LLMResponse(
            success=False,
            error=str(e)
        )


@router.get("/codes")
async def list_available_codes():
    """
    List available IS Codes in the database
    
    Returns:
        List of IS Code references
    """
    try:
        # Get all codes from vector store
        codes = search_is_codes("", top_k=100)  # Get all
        
        return {
            "success": True,
            "count": len(codes),
            "codes": [
                {
                    "code": code.get("code"),
                    "title": code.get("title"),
                    "category": code.get("category")
                }
                for code in codes
            ]
        }
    except Exception as e:
        logger.error(f"Failed to list codes: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/search")
async def search_codes(query: str, limit: int = 5):
    """
    Search IS Code database
    
    Args:
        query: Search query
        limit: Maximum results
        
    Returns:
        Relevant IS Code sections
    """
    try:
        results = search_is_codes(query, top_k=limit)
        
        return {
            "success": True,
            "count": len(results),
            "results": results
        }
    except Exception as e:
        logger.error(f"Code search failed: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "module": "iscode"}
