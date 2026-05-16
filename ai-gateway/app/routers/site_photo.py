"""
Site Photo Analyzer Router
Analyzes construction site photos for safety hazards and progress
"""
import json
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.llm_chain import call_vision_llm
from app.models.schemas import LLMResponse, SitePhotoAnalysisResult

router = APIRouter()
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a construction site safety inspector and progress monitoring expert with expertise in Indian construction safety standards.

CRITICAL INSTRUCTIONS:
1. Analyze ONLY what is visible in the image
2. Do NOT assume hazards that are not clearly visible
3. Be specific about locations in the image
4. Reference relevant IS codes for safety violations
5. Provide realistic safety scores based on visible conditions

Analyze this construction site photo and return JSON:
{
  "safety_hazards": [
    {
      "hazard": "Workers without safety helmets",
      "severity": "HIGH",
      "location_in_image": "Center-left, near scaffolding",
      "recommendation": "Ensure all workers wear approved safety helmets (IS 2925:1984)"
    },
    {
      "hazard": "Unsecured scaffolding",
      "severity": "CRITICAL",
      "location_in_image": "Right side of image",
      "recommendation": "Secure scaffolding with proper bracing and toe boards per IS 3696:1987"
    }
  ],
  "progress_assessment": "Foundation work appears 60% complete. PCC laid, reinforcement placement in progress. Formwork for columns visible. No major delays observed based on visible work.",
  "visible_materials": [
    "Cement bags (stacked)",
    "Steel reinforcement bars (TMT)",
    "Formwork (plywood)",
    "Concrete mixer",
    "Scaffolding (steel tubular)"
  ],
  "recommendations": [
    "Provide safety helmets and harnesses to all workers",
    "Install safety nets around scaffolding",
    "Cover cement bags to protect from moisture",
    "Ensure proper curing of concrete",
    "Mark hazardous zones with barricades"
  ],
  "overall_safety_score": 45
}

ANALYSIS GUIDELINES:

Safety Hazards (look for):
- PPE violations: No helmets (IS 2925), no safety shoes, no harnesses
- Scaffolding issues: Unstable, no guardrails, improper bracing (IS 3696)
- Excavation: Unsupported trenches, no barricades (IS 3764)
- Electrical: Exposed wires, improper connections
- Material storage: Unsafe stacking, blocking exits
- Housekeeping: Debris, clutter, trip hazards

Severity Levels:
- CRITICAL: Immediate danger of serious injury/death
- HIGH: Significant risk requiring urgent action
- MEDIUM: Moderate risk, should be addressed soon
- LOW: Minor issue, good practice to fix

Progress Assessment:
- Describe visible construction stage
- Estimate completion percentage if possible
- Note quality of workmanship visible
- Do NOT estimate timeline or make assumptions

Safety Score (0-100):
- 90-100: Excellent safety practices
- 70-89: Good, minor improvements needed
- 50-69: Fair, several issues to address
- 30-49: Poor, significant safety concerns
- 0-29: Critical, work should stop until issues resolved

Return ONLY valid JSON. No explanation outside the JSON.
"""


@router.post("/analyze", response_model=LLMResponse)
async def analyze_site_photo(file: UploadFile = File(...)):
    """
    Analyze construction site photo
    
    Args:
        file: Image file (JPG/PNG)
        
    Returns:
        Safety hazards, progress assessment, and recommendations
    """
    try:
        # Validate file type
        allowed_types = ['.jpg', '.jpeg', '.png', '.webp']
        if not any(file.filename.lower().endswith(ext) for ext in allowed_types):
            raise HTTPException(
                status_code=400,
                detail="Only JPG, PNG, and WEBP images are supported"
            )
        
        # Read image
        image_bytes = await file.read()
        logger.info(f"Processing site photo: {file.filename} ({len(image_bytes)} bytes)")
        
        # Validate image size (max 10MB for free tier)
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Image size must be less than 10MB"
            )
        
        # Determine MIME type
        mime_type = "image/jpeg"
        if file.filename.lower().endswith('.png'):
            mime_type = "image/png"
        elif file.filename.lower().endswith('.webp'):
            mime_type = "image/webp"
        
        # Call vision LLM
        result_text, provider = await call_vision_llm(
            system_prompt=SYSTEM_PROMPT,
            image_data=image_bytes,
            mime_type=mime_type,
            max_tokens=2500
        )
        
        # Parse JSON response
        try:
            result_data = json.loads(result_text)
            validated_result = SitePhotoAnalysisResult(**result_data)
            
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
        logger.error(f"Site photo analysis failed: {str(e)}")
        return LLMResponse(
            success=False,
            error=str(e)
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "module": "site_photo"}
