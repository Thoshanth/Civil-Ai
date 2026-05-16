# CivilAI Gateway - Complete Project Understanding

## 📋 Project Overview

**CivilAI Gateway** is an AI-powered microservice that provides intelligent analysis for civil engineering documents and data. It uses Large Language Models (LLMs) with a fallback chain architecture and implements Retrieval-Augmented Generation (RAG) for Indian Standard (IS) Code compliance checking.

### Core Purpose
Transform civil engineering workflows by automating:
- Document analysis (PDFs, images)
- Code compliance checking
- Quantity estimation
- Load calculations
- Safety assessments

---

## 🏗️ Architecture

### Technology Stack

**Backend Framework:**
- **FastAPI** - Modern async Python web framework
- **Uvicorn** - ASGI server with hot reload
- **Pydantic** - Data validation and serialization

**AI/ML Components:**
- **Groq** - Primary LLM provider (LLaMA 3.3 70B)
- **Google Gemini** - Fallback LLM + Vision API
- **HuggingFace** - Secondary fallback (Mistral 7B)
- **Sentence Transformers** - Text embeddings (all-MiniLM-L6-v2)
- **FAISS** - Vector similarity search for RAG

**Document Processing:**
- **PyMuPDF (fitz)** - PDF text extraction
- **pdfplumber** - PDF table extraction
- **Pillow** - Image processing

**Database:**
- **Supabase** - PostgreSQL with vector extensions (pgvector)
- Used for IS Code storage and retrieval

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Application                      │
│                         (main.py)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
   │ Routers │   │Services │   │ Models  │
   └─────────┘   └─────────┘   └─────────┘
        │              │              │
   ┌────▼────────┬────▼────────┬────▼─────┐
   │  geotech    │ llm_chain   │ schemas  │
   │  boq        │ pdf_parser  │          │
   │  iscode     │vector_store │          │
   │  structural │             │          │
   │  tender     │             │          │
   │  site_photo │             │          │
   └─────────────┴─────────────┴──────────┘
```

---

## 🔧 Core Components

### 1. LLM Fallback Chain (`llm_chain.py`)

**Purpose:** Ensure high availability by trying multiple LLM providers in sequence.

**Fallback Order:**
1. **Groq** (Primary) - Fast, free tier, LLaMA 3.3 70B
2. **Gemini** (Fallback) - Google's model, good for vision
3. **HuggingFace** (Last resort) - Mistral 7B Instruct

**Key Features:**
- Async/await for non-blocking calls
- Timeout handling (30s per provider)
- Automatic markdown code block extraction
- Vision API support (Gemini)

**Code Flow:**
```python
async def call_llm(system_prompt, user_message):
    for provider in [Groq, Gemini, HuggingFace]:
        try:
            response = await provider.call(...)
            return clean_response(response), provider_name
        except Exception:
            continue  # Try next provider
    raise RuntimeError("All providers failed")
```

### 2. Vector Store RAG (`vector_store.py`)

**Purpose:** Enable semantic search over IS Code documents for compliance checking.

**Architecture:**
- **Embeddings:** Sentence Transformers (384-dim vectors)
- **Index:** FAISS for fast similarity search (fallback to sklearn)
- **Storage:** In-memory with disk persistence

**Workflow:**
```
User Query → Encode → FAISS Search → Top-K Results → LLM Context
```

**Sample IS Codes Loaded:**
- IS 456:2000 - Concrete structures
- IS 800:2007 - Steel structures
- IS 1893:2016 - Seismic design
- IS 875:2015 - Design loads
- IS 2911:2010 - Pile foundations
- IS 1904:1986 - Shallow foundations

### 3. PDF Parser (`pdf_parser.py`)

**Purpose:** Extract text and tables from engineering PDFs.

**Capabilities:**
- Text extraction with PyMuPDF
- Table detection with pdfplumber
- Page-by-page processing
- Error handling for corrupted PDFs

**Usage:**
```python
text = await extract_text_from_pdf(pdf_bytes, max_pages=50)
tables = await extract_tables_from_pdf(pdf_bytes, max_pages=50)
```

---

## 📦 Modules (Routers)

### 1. Geotechnical Analysis (`geotech.py`)

**Endpoint:** `POST /api/geotech/analyze`

**Input:** 
- PDF file (borehole log)
- OR JSON data with soil parameters

**Output:**
```json
{
  "soil_layers": [
    {
      "depth_m": 3.0,
      "soil_type": "Medium dense sand",
      "spt_n_value": 15,
      "description": "Brown fine to medium sand"
    }
  ],
  "bearing_capacity": {
    "shallow_kPa": 150,
    "pile_kN": 450
  },
  "groundwater_depth_m": 2.5,
  "foundation_recommendation": "Shallow foundation suitable",
  "risk_flags": ["High water table"],
  "is_code_references": ["IS 1904:1986", "IS 2911:2010"]
}
```

**LLM Prompt Strategy:**
- Extract soil layers with SPT N-values
- Calculate bearing capacity per IS codes
- Identify risks (liquefaction, settlement)
- Recommend foundation type

### 2. BOQ Analysis (`boq.py`)

**Endpoint:** `POST /api/boq/analyze`

**Input:**
- PDF file (drawing/BOQ sheet)
- OR form data with description

**Output:**
```json
{
  "items": [
    {
      "item_no": "1",
      "description": "Earthwork in excavation",
      "unit": "cum",
      "quantity": 150.0,
      "cpwd_rate_inr": 180.50,
      "amount_inr": 27075.0
    }
  ],
  "total_amount_inr": 261075.0,
  "notes": "Rates as per CPWD DSR 2023",
  "summary": "Foundation work - 2 items totaling ₹2.61 lakhs"
}
```

**LLM Prompt Strategy:**
- Extract work items from document
- Apply CPWD DSR 2023 rates
- Calculate quantities and amounts
- Provide cost summary

**CPWD Rates Embedded in Prompt:**
- Earthwork: ₹180-220/cum
- PCC 1:4:8: ₹5,200-5,500/cum
- RCC M20/M25/M30: ₹6,500-7,500/cum
- Brick masonry: ₹580-650/sqm
- Plastering: ₹180-220/sqm

### 3. IS Code Compliance (`iscode.py`)

**Endpoints:**
- `POST /api/iscode/query` - Ask questions about IS codes
- `POST /api/iscode/check` - Check design compliance
- `GET /api/iscode/codes` - List available codes
- `GET /api/iscode/search` - Search code database

**RAG Workflow:**
```
1. User asks: "What is minimum reinforcement in beams?"
2. Query embedded → Vector search → Top 3 relevant IS code sections
3. Retrieved context + query → LLM
4. LLM generates answer with code references
```

**Example Query Response:**
```json
{
  "answer": "As per IS 456:2000, minimum reinforcement in beams shall be 0.85 bd/fy for Fe 415 steel.",
  "references": [
    {
      "code": "IS 456:2000",
      "clause": "26.5.1.1",
      "text": "Minimum reinforcement..."
    }
  ]
}
```

**Example Compliance Check:**
```json
{
  "overall_status": "COMPLIANT",
  "checks": [
    {
      "clause": "IS 456:2000 Cl. 26.5.1.1",
      "description": "Minimum reinforcement",
      "status": "PASS",
      "provided_value": "0.90%",
      "required_value": "0.85%"
    }
  ]
}
```

### 4. Structural Load Calculation (`structural.py`)

**Endpoint:** `POST /api/structural/calculate`

**Input:**
```json
{
  "building_type": "residential",
  "floor_area_m2": 1000,
  "floors": 5,
  "zone": "III",
  "soil_type": "II",
  "importance_factor": 1.0
}
```

**Output:**
```json
{
  "dead_load_kN": 12500,
  "live_load_kN": 2000,
  "seismic_load_kN": 1800,
  "wind_load_kN": 950,
  "total_load_kN": 17250,
  "load_combinations": [
    {"combination": "1.5(DL+LL)", "value_kN": 21750},
    {"combination": "1.2(DL+LL+EL)", "value_kN": 19560}
  ],
  "summary": "Total design load for 5-story residential building"
}
```

**IS Codes Applied:**
- IS 875 Part 1 - Dead loads
- IS 875 Part 2 - Live loads
- IS 875 Part 3 - Wind loads
- IS 1893:2016 - Seismic loads

### 5. Tender Document Analysis (`tender.py`)

**Endpoint:** `POST /api/tender/analyze`

**Input:** PDF file (tender document)

**Output:**
```json
{
  "project_name": "Construction of 4-lane highway",
  "tender_value_inr": 50000000,
  "key_dates": [
    {
      "event": "Bid submission deadline",
      "date": "2024-06-15",
      "days_remaining": 30
    }
  ],
  "eligibility_criteria": [
    {
      "criterion": "Annual turnover",
      "requirement": "₹10 crores in last 3 years",
      "is_critical": true
    }
  ],
  "scope_summary": "Construction of 10km highway with bridges",
  "risk_clauses": ["Liquidated damages: 0.5% per week"],
  "compliance_checklist": ["EMD: ₹10 lakhs", "PAN card", "GST registration"]
}
```

**LLM Extraction Strategy:**
- Identify project details and value
- Extract critical dates
- List eligibility requirements
- Flag risk clauses (penalties, warranties)
- Generate compliance checklist

### 6. Site Photo Analysis (`site_photo.py`)

**Endpoint:** `POST /api/site_photo/analyze`

**Input:** Image file (JPEG/PNG)

**Output:**
```json
{
  "safety_hazards": [
    {
      "hazard": "Workers without helmets",
      "severity": "HIGH",
      "location_in_image": "Center-left area",
      "recommendation": "Enforce PPE policy immediately"
    }
  ],
  "progress_assessment": "Foundation work 60% complete",
  "visible_materials": ["Cement bags", "Steel bars", "Formwork"],
  "recommendations": [
    "Improve site housekeeping",
    "Install safety signage"
  ],
  "overall_safety_score": 65
}
```

**Vision LLM Used:** Gemini 1.5 Flash

**Analysis Focus:**
- Safety hazards (PPE, scaffolding, excavation)
- Work progress estimation
- Material identification
- Quality issues

---

## 🔐 Environment Configuration

**Required Variables (`.env`):**
```env
# LLM Providers (at least one required)
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
HF_TOKEN=hf_...

# Database (for IS Code RAG)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...

# Optional
LOG_LEVEL=INFO
```

---

## 📊 Data Models (Pydantic Schemas)

### Common Response
```python
class LLMResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]]
    error: Optional[str]
    llm_provider: Optional[str]  # "Groq", "Gemini", etc.
    tokens_used: Optional[int]
```

### Geotechnical
- `SoilLayer` - Depth, type, SPT N-value
- `BearingCapacity` - Shallow/pile capacity
- `GeotechAnalysisResult` - Complete analysis

### BOQ
- `BOQItem` - Item no, description, unit, quantity, rate
- `BOQAnalysisResult` - Items list + total

### IS Code
- `ComplianceCheck` - Clause, status (PASS/FAIL), values
- `ISCodeComplianceResult` - Overall status + checks

### Structural
- `LoadCombination` - Combination name + value
- `LoadCalculationResult` - All load types + combinations

### Tender
- `TenderKeyDate` - Event, date, days remaining
- `TenderEligibility` - Criterion, requirement, criticality
- `TenderAnalysisResult` - Complete tender analysis

### Site Photo
- `SafetyHazard` - Hazard, severity, location, recommendation
- `SitePhotoAnalysisResult` - Hazards + progress + score

---

## 🚀 API Usage Examples

### 1. Analyze Geotechnical Report
```bash
curl -X POST http://localhost:8000/api/geotech/analyze \
  -F "file=@borehole_log.pdf"
```

### 2. Generate BOQ from Description
```bash
curl -X POST http://localhost:8000/api/boq/analyze \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "description=Excavation 50 cum, PCC 1:4:8 for 20 cum, RCC M25 columns 15 cum"
```

### 3. Query IS Code
```bash
curl -X POST http://localhost:8000/api/iscode/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the minimum grade of concrete for RCC work?"}'
```

### 4. Check Design Compliance
```bash
curl -X POST http://localhost:8000/api/iscode/check \
  -H "Content-Type: application/json" \
  -d '{
    "design_type": "structural",
    "parameters": {
      "concrete_grade": "M25",
      "steel_grade": "Fe 415",
      "beam_width_mm": 300,
      "beam_depth_mm": 450,
      "reinforcement_percent": 0.90
    },
    "codes_to_check": ["IS 456:2000"]
  }'
```

### 5. Calculate Structural Loads
```bash
curl -X POST http://localhost:8000/api/structural/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "building_type": "residential",
    "floor_area_m2": 1000,
    "floors": 5,
    "zone": "III",
    "soil_type": "II"
  }'
```

### 6. Analyze Site Photo
```bash
curl -X POST http://localhost:8000/api/site_photo/analyze \
  -F "file=@construction_site.jpg"
```

### 7. Analyze Tender Document
```bash
curl -X POST http://localhost:8000/api/tender/analyze \
  -F "file=@tender_document.pdf"
```

---

## 🧪 Testing

### Test Files
- `test_startup.py` - Basic server health check
- `test_api_endpoints.py` - Individual endpoint tests
- `test_e2e.py` - End-to-end workflow tests

### Run Tests
```bash
# All tests
python -m pytest

# Specific test
python test_startup.py

# With coverage
pytest --cov=app tests/
```

---

## 🔄 Request/Response Flow

### Example: BOQ Analysis from PDF

```
1. Client uploads PDF
   ↓
2. FastAPI receives multipart/form-data
   ↓
3. Router (boq.py) validates file
   ↓
4. PDF Parser extracts text + tables
   ↓
5. System prompt + extracted content → LLM Chain
   ↓
6. Groq LLM processes (or fallback to Gemini/HF)
   ↓
7. LLM returns JSON (with markdown code blocks)
   ↓
8. extract_json_from_markdown() cleans response
   ↓
9. Pydantic validates against BOQAnalysisResult schema
   ↓
10. Return LLMResponse with success=True, data={...}
```

### Example: IS Code Query with RAG

```
1. Client sends query: "minimum reinforcement in beams"
   ↓
2. Router (iscode.py) receives query
   ↓
3. Vector Store: Encode query → FAISS search
   ↓
4. Retrieve top 3 relevant IS code sections
   ↓
5. Build context: Retrieved sections + query
   ↓
6. System prompt + context → LLM Chain
   ↓
7. LLM generates answer with code references
   ↓
8. Return structured response with answer + references
```

---

## 🎯 Key Design Decisions

### 1. Why Fallback Chain?
- **Reliability:** If Groq is down, Gemini takes over
- **Cost:** Groq free tier is generous, fallback to paid only if needed
- **Performance:** Groq is fastest, Gemini for vision, HF as last resort

### 2. Why In-Memory Vector Store?
- **Simplicity:** No external vector DB setup required
- **Speed:** FAISS is extremely fast for small datasets
- **Portability:** Can save/load from disk
- **Limitation:** Not suitable for >100K documents

### 3. Why Pydantic?
- **Validation:** Ensures LLM output matches expected schema
- **Documentation:** Auto-generates OpenAPI docs
- **Type Safety:** Catches errors at runtime

### 4. Why Async/Await?
- **Concurrency:** Handle multiple requests without blocking
- **LLM Calls:** Network I/O is slow, async prevents blocking
- **Scalability:** Can handle 100s of concurrent requests

---

## 📈 Performance Characteristics

### LLM Response Times
- **Groq:** 1-3 seconds (fastest)
- **Gemini:** 2-5 seconds
- **HuggingFace:** 5-10 seconds (slowest)

### PDF Processing
- **Small PDF (5 pages):** <1 second
- **Large PDF (50 pages):** 3-5 seconds
- **Table extraction:** +1-2 seconds

### Vector Search
- **FAISS (1000 docs):** <10ms
- **Sklearn fallback:** <50ms

### Typical End-to-End
- **JSON request:** 2-4 seconds
- **PDF upload:** 5-8 seconds
- **Image analysis:** 3-6 seconds

---

## 🛡️ Error Handling

### LLM Failures
- Automatic fallback to next provider
- Timeout after 30s per provider
- Detailed error logging

### PDF Parsing Failures
- Graceful degradation (return partial text)
- Error messages in response
- Support for corrupted PDFs

### Validation Failures
- Pydantic returns clear error messages
- HTTP 400 for bad requests
- HTTP 500 for server errors

---

## 🔮 Future Enhancements

### Planned Features
1. **Persistent Vector Store** - PostgreSQL with pgvector
2. **More IS Codes** - Expand from 6 to 100+ codes
3. **Drawing Analysis** - Extract dimensions from CAD drawings
4. **Cost Optimization** - Track token usage, optimize prompts
5. **Caching** - Redis for repeated queries
6. **Batch Processing** - Analyze multiple files at once
7. **Webhooks** - Async notifications for long-running tasks

### Scalability Improvements
- **Horizontal Scaling:** Deploy multiple instances behind load balancer
- **Queue System:** Celery for background tasks
- **CDN:** Cache static responses
- **Database:** Move from in-memory to PostgreSQL

---

## 📚 Key Learnings

### What Works Well
✅ Fallback chain ensures high availability
✅ RAG significantly improves IS Code accuracy
✅ Pydantic validation catches LLM hallucinations
✅ Async FastAPI handles concurrent requests efficiently

### Challenges Faced
⚠️ LLM sometimes returns markdown-wrapped JSON
⚠️ PDF table extraction is imperfect
⚠️ FAISS requires numpy <2.0 (compatibility issue)
⚠️ Vision API (Gemini) is slower than text-only

### Best Practices
1. Always validate LLM output with Pydantic
2. Use timeouts for all external API calls
3. Log provider used for debugging
4. Clean markdown from LLM responses
5. Provide detailed system prompts with examples

---

## 🎓 How to Extend

### Adding a New Module

1. **Create Router** (`app/routers/new_module.py`):
```python
from fastapi import APIRouter
from app.services.llm_chain import call_llm
from app.models.schemas import LLMResponse

router = APIRouter()

@router.post("/analyze")
async def analyze_new_module(data: dict):
    system_prompt = "You are an expert in..."
    user_message = f"Analyze: {data}"
    result, provider = await call_llm(system_prompt, user_message)
    return LLMResponse(success=True, data=result, llm_provider=provider)
```

2. **Add Schema** (`app/models/schemas.py`):
```python
class NewModuleResult(BaseModel):
    field1: str
    field2: int
```

3. **Register Router** (`app/main.py`):
```python
from app.routers import new_module
app.include_router(new_module.router, prefix="/api/new_module", tags=["New Module"])
```

4. **Test**:
```bash
curl -X POST http://localhost:8000/api/new_module/analyze \
  -H "Content-Type: application/json" \
  -d '{"data": "test"}'
```

---

## 📞 Support & Maintenance

### Monitoring
- Check `/health` endpoint for uptime
- Monitor LLM provider usage (Groq dashboard)
- Track error rates in logs

### Common Issues
1. **"All LLM providers failed"** → Check API keys in `.env`
2. **"FAISS not available"** → Install faiss-cpu, ensure numpy <2.0
3. **"PDF parsing failed"** → Check file is valid PDF
4. **Slow responses** → Check network, LLM provider status

### Logs
```bash
# View logs
tail -f logs/app.log

# Search for errors
grep ERROR logs/app.log

# Check LLM provider usage
grep "Successfully got response from" logs/app.log | sort | uniq -c
```

---

## 🏁 Conclusion

CivilAI Gateway is a production-ready AI microservice that demonstrates:
- **Robust LLM integration** with fallback handling
- **RAG implementation** for domain-specific knowledge
- **Document processing** at scale
- **Clean API design** with FastAPI
- **Type safety** with Pydantic

The architecture is modular, extensible, and follows best practices for async Python web services.

---

**Last Updated:** May 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅
