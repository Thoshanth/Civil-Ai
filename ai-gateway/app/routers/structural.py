"""
Structural Load Calculator Router
Calculates loads per IS 875 and IS 1893
"""
import json
import logging
from fastapi import APIRouter, HTTPException
from app.services.llm_chain import call_llm
from app.models.schemas import LLMResponse, LoadCalculationRequest, LoadCalculationResult

router = APIRouter()
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a structural engineer calculating loads per IS codes.

Calculate loads for the given building and return ONLY this JSON format (no other text):

{
  "dead_load_kN": 2500.0,
  "live_load_kN": 800.0,
  "seismic_load_kN": 450.0,
  "wind_load_kN": 320.0,
  "total_load_kN": 3770.0,
  "load_combinations": [
    {"combination": "1.5(DL+LL)", "value_kN": 4950.0},
    {"combination": "1.2(DL+LL+EL)", "value_kN": 4500.0},
    {"combination": "1.5(DL+WL)", "value_kN": 4230.0}
  ],
  "summary": "G+3 residential building in Zone IV. Dead load: 2500 kN. Live load: 800 kN. Seismic load: 450 kN. Critical combination: 1.5(DL+LL) = 4950 kN."
}

Calculation formulas:
- Dead Load = 0.28 × floor_area × floors × 25 kN/m³ (RCC volume estimate)
- Live Load = floor_area × floors × 2 kN/m² (residential)
- Seismic: Ah = (Z/2) × (I/R) × 2.5, where Z(IV)=0.24, I=importance_factor, R=3
- Seismic Load = Ah × (Dead Load + 0.25 × Live Load)
- Wind Load = 1.5 kN/m² × exposed area (estimate as 0.3 × total floor area)
- Total = DL + LL + max(Seismic, Wind)

Load combinations per IS 456:
1. 1.5(DL + LL)
2. 1.2(DL + LL + EL)
3. 1.5(DL + WL)

Return ONLY valid JSON, no explanation.
"""


@router.post("/calculate", response_model=LLMResponse)
async def calculate_loads(request: LoadCalculationRequest):
    """
    Calculate structural loads per IS codes
    
    Args:
        request: Building parameters
        
    Returns:
        Load calculations with combinations
    """
    try:
        logger.info(f"Calculating loads for {request.building_type} building")
        
        # Prepare user message
        user_message = f"""Calculate loads for:
Building: {request.building_type}
Floor area: {request.floor_area_m2} m² per floor
Floors: {request.floors}
Zone: {request.zone}
Soil: {request.soil_type}
Importance: {request.importance_factor}

Calculate and return JSON only.
"""
        
        # Call LLM
        result_text, provider = await call_llm(
            system_prompt=SYSTEM_PROMPT,
            user_message=user_message,
            max_tokens=2000,
            temperature=0.3  # Slightly higher for better JSON generation
        )
        
        # Parse JSON response
        try:
            result_data = json.loads(result_text)
            validated_result = LoadCalculationResult(**result_data)
            
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
        logger.error(f"Load calculation failed: {str(e)}")
        return LLMResponse(
            success=False,
            error=str(e)
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "module": "structural"}
