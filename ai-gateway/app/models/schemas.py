"""
Pydantic Models for Request/Response Schemas
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# Common Response Models
class LLMResponse(BaseModel):
    """Base LLM response"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    llm_provider: Optional[str] = None
    tokens_used: Optional[int] = None


# Geotechnical Models
class SoilLayer(BaseModel):
    depth_m: str
    soil_type: str
    spt_n_value: Optional[str] = None
    description: str


class BearingCapacity(BaseModel):
    shallow_kPa: Optional[float] = None
    pile_kN: Optional[float] = None


class GeotechAnalysisResult(BaseModel):
    soil_layers: List[SoilLayer]
    bearing_capacity: BearingCapacity
    groundwater_depth_m: Optional[float] = None
    foundation_recommendation: str
    risk_flags: List[str] = []
    is_code_references: List[str] = []


# BOQ Models
class BOQItem(BaseModel):
    item_no: str
    description: str
    unit: str
    quantity: float
    cpwd_rate_inr: Optional[float] = None
    amount_inr: Optional[float] = None


class BOQAnalysisResult(BaseModel):
    items: List[BOQItem]
    total_amount_inr: float
    notes: Optional[str] = None
    summary: Optional[str] = None


# IS Code Compliance Models
class ComplianceCheck(BaseModel):
    clause: str
    description: str
    status: str  # PASS, FAIL, WARNING
    provided_value: Optional[str] = None
    required_value: Optional[str] = None
    remarks: Optional[str] = None


class ISCodeComplianceResult(BaseModel):
    overall_status: str  # COMPLIANT, NON_COMPLIANT, NEEDS_REVIEW
    checks: List[ComplianceCheck]
    recommendations: List[str] = []


class ISCodeCheckRequest(BaseModel):
    """Request for IS Code compliance check"""
    design_type: str = Field(..., description="structural, geotechnical, hydraulic")
    parameters: Dict[str, Any] = Field(..., description="Design parameters to check")
    codes_to_check: Optional[List[str]] = Field(None, description="Specific IS codes to verify")


# Structural Load Models
class LoadCombination(BaseModel):
    combination: str
    value_kN: float


class LoadCalculationRequest(BaseModel):
    building_type: str
    floor_area_m2: float
    floors: int
    zone: str  # II, III, IV, V
    soil_type: str  # I, II, III
    importance_factor: float = 1.0


class LoadCalculationResult(BaseModel):
    dead_load_kN: float
    live_load_kN: float
    seismic_load_kN: float
    wind_load_kN: Optional[float] = None
    total_load_kN: float
    load_combinations: List[LoadCombination]
    summary: str


# Tender Analysis Models
class TenderKeyDate(BaseModel):
    event: str
    date: str
    days_remaining: Optional[int] = None


class TenderEligibility(BaseModel):
    criterion: str
    requirement: str
    is_critical: bool


class TenderAnalysisResult(BaseModel):
    project_name: str
    tender_value_inr: Optional[float] = None
    key_dates: List[TenderKeyDate]
    eligibility_criteria: List[TenderEligibility]
    scope_summary: str
    risk_clauses: List[str]
    compliance_checklist: List[str]


# Site Photo Analysis Models
class SafetyHazard(BaseModel):
    hazard: str
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    location_in_image: Optional[str] = None
    recommendation: str


class SitePhotoAnalysisResult(BaseModel):
    safety_hazards: List[SafetyHazard]
    progress_assessment: str
    visible_materials: List[str]
    recommendations: List[str]
    overall_safety_score: Optional[int] = Field(None, ge=0, le=100)


# File Upload Response
class FileUploadResponse(BaseModel):
    file_id: str
    file_name: str
    file_size: int
    storage_path: str
    uploaded_at: str
