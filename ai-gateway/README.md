# CivilAI Gateway (FastAPI)

AI/LLM service for CivilAI platform. Handles document parsing, LLM calls with fallback chain, and vector search.

## Features

- **Multi-LLM Fallback**: Groq → Gemini → HuggingFace
- **PDF Parsing**: Text, tables, and image extraction
- **Vision Analysis**: Site photo analysis with Gemini Vision
- **Vector Search**: RAG for IS Code compliance
- **6 Modules**: Geotechnical, BOQ, IS Code, Structural, Tender, Site Photo

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Required API keys:
- **Groq**: Get from https://console.groq.com
- **Gemini**: Get from https://aistudio.google.com/app/apikey
- **HuggingFace**: Get from https://huggingface.co/settings/tokens

### 4. Run Server

```bash
# Development
uvicorn app.main:app --reload --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Geotechnical Analysis
```bash
POST /api/geotech/analyze
Content-Type: multipart/form-data
Body: file (PDF)
```

### BOQ Analysis
```bash
POST /api/boq/analyze
Content-Type: multipart/form-data
Body: file (PDF) or description (text)
```

### IS Code Compliance
```bash
POST /api/iscode/check
Content-Type: application/json
Body: {
  "design_type": "structural",
  "parameters": {...}
}
```

### Structural Load Calculator
```bash
POST /api/structural/calculate
Content-Type: application/json
Body: {
  "building_type": "residential",
  "floor_area_m2": 400,
  "floors": 4,
  "zone": "IV",
  "soil_type": "II"
}
```

### Tender Analysis
```bash
POST /api/tender/analyze
Content-Type: multipart/form-data
Body: file (PDF)
```

### Site Photo Analysis
```bash
POST /api/site/analyze
Content-Type: multipart/form-data
Body: file (JPG/PNG)
```

## Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test geotechnical analysis
curl -X POST http://localhost:8000/api/geotech/analyze \
  -F "file=@sample_borehole.pdf"
```

## Deployment

### Render.com (Free Tier)

1. Create `render.yaml` (already included)
2. Connect GitHub repository
3. Add environment variables in Render dashboard
4. Deploy

### Docker

```bash
docker build -t civilai-gateway .
docker run -p 8000:8000 --env-file .env civilai-gateway
```

## Free Tier Limits

- **Groq**: 14,400 requests/day
- **Gemini**: 1,500 requests/day (15 req/min)
- **HuggingFace**: Rate limited
- **Render.com**: 750 hours/month

## Architecture

```
FastAPI App
├── routers/          # API endpoints
├── services/         # Business logic
│   ├── llm_chain.py      # LLM fallback
│   ├── pdf_parser.py     # PDF processing
│   └── vector_store.py   # RAG/search
└── models/           # Pydantic schemas
```

## License

MIT
