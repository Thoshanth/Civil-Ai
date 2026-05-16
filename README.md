# CivilAI Platform

AI-powered analysis platform for civil engineering documents and data.

## 🎯 What is CivilAI?

CivilAI automates civil engineering workflows using Large Language Models (LLMs) with fallback chains and Retrieval-Augmented Generation (RAG) for Indian Standard (IS) Code compliance.

### Core Capabilities

- **Geotechnical Analysis** - Extract soil profiles, bearing capacity from borehole logs
- **BOQ Generation** - Auto-generate Bill of Quantities with CPWD rates
- **IS Code Compliance** - Check designs against Indian Standards
- **Structural Calculations** - Compute loads per IS 875, IS 1893
- **Tender Analysis** - Extract key dates, eligibility, risks from tender documents
- **Site Safety** - Analyze construction photos for safety hazards

## 📊 Current Status

| Component | Status | Progress |
|-----------|--------|----------|
| **AI Gateway** (FastAPI) | ✅ Complete | 100% |
| **Backend** (Spring Boot) | ✅ Complete | 100% |
| **Frontend** (React) | ✅ Complete | 100% |
| **Deployment** | 🔜 Pending | 0% |

**Overall: 75% Complete**

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                      │
│              (Vite + TailwindCSS)                    │
└──────────────────┬──────────────────────────────────┘
                   │ REST API (JWT)
┌──────────────────▼──────────────────────────────────┐
│            Spring Boot Backend                       │
│  ┌──────────┬──────────┬──────────┬──────────┐     │
│  │  Auth    │ Projects │Documents │ Analysis │     │
│  │  Users   │          │ Reports  │          │     │
│  └──────────┴──────────┴──────────┴──────────┘     │
└──────┬────────────────────────────────────┬─────────┘
       │                                    │
       │ WebClient                          │ MinIO
       │                                    │
┌──────▼────────────────────────┐   ┌──────▼─────────┐
│     FastAPI AI Gateway         │   │  File Storage  │
│  ┌────────────────────────┐   │   │   (PDFs/Images)│
│  │  LLM Fallback Chain    │   │   └────────────────┘
│  │  Groq → Gemini → HF    │   │
│  └────────────────────────┘   │
│  ┌────────────────────────┐   │
│  │  Vector Store (RAG)    │   │
│  │  IS Code Database      │   │
│  └────────────────────────┘   │
└───────────────────────────────┘
       │
┌──────▼────────────────────────┐
│    PostgreSQL (Neon.tech)     │
│  Users, Projects, Documents   │
│  Reports, Audit Trail         │
└───────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Java 21
- Maven 3.8+
- Node.js 20+
- Python 3.11+
- Docker (for MinIO)

### 1. Start MinIO

```bash
docker run -d --name civilai-minio -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin123 \
  minio/minio server /data --console-address ":9001"
```

Create bucket at http://localhost:9001:
- Login: `minioadmin` / `minioadmin123`
- Create bucket: `civilai-files`

### 2. Setup Database

1. Sign up at https://neon.tech (free)
2. Create project: `civilai`
3. Copy connection string

### 3. Start AI Gateway

```bash
cd ai-gateway
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure .env with API keys
cp .env.example .env
# Add GROQ_API_KEY, GEMINI_API_KEY

uvicorn app.main:app --reload --port 8000
```

### 4. Start Backend

```bash
cd backend
cp .env.example .env
# Edit .env with database credentials

mvn spring-boot:run
```

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 6. Test

- Frontend: http://localhost:5173
- AI Gateway: http://localhost:8000/health
- Backend: http://localhost:8080/actuator/health
- Swagger UI: http://localhost:8080/swagger-ui

## 📚 Documentation

- **[UNDERSTANDING.md](UNDERSTANDING.md)** - Complete system architecture
- **[QUICK_START.md](QUICK_START.md)** - Setup guide
- **[BACKEND_COMPLETE.md](BACKEND_COMPLETE.md)** - Backend implementation details
- **[COMPLETION_STATUS.md](COMPLETION_STATUS.md)** - Current progress
- **[implementation (3).md](implementation%20(3).md)** - Original implementation plan
- **[backend/README.md](backend/README.md)** - Backend-specific docs

## 🔌 API Endpoints (25 total)

### Authentication (8)
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Reset with OTP
- `POST /api/auth/verify-otp` - Verify email
- `POST /api/auth/resend-otp` - Resend code
- `POST /api/auth/login-otp` - OTP login
- `POST /api/auth/verify-login-otp` - Verify OTP login

### Projects (5)
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Documents (5)
- `POST /api/documents/upload` - Upload file
- `GET /api/documents/project/{projectId}` - List documents
- `GET /api/documents/{id}` - Get document
- `GET /api/documents/{id}/download-url` - Get download URL
- `DELETE /api/documents/{id}` - Delete document

### Analysis (2)
- `POST /api/analyze/{module}` - Analyze file
- `POST /api/analyze/{module}/json` - Analyze JSON

Modules: `geotech`, `boq`, `iscode`, `structural`, `tender`, `site-photo`

### Reports (4)
- `GET /api/reports/{id}` - Get report
- `GET /api/reports/document/{documentId}` - List document reports
- `GET /api/reports/module/{module}` - List module reports
- `GET /api/reports/{id}/audit` - Get audit trail

### Users (1)
- `GET /api/users/me` - Get current user

## 🧪 Example Usage

```bash
# 1. Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","fullName":"John Doe"}'

# 2. Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Response: {"token":"eyJhbG...","user":{...}}

# 3. Create Project
curl -X POST http://localhost:8080/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Highway Project","description":"NH-44 expansion"}'

# 4. Upload Document
curl -X POST http://localhost:8080/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@borehole_log.pdf" \
  -F "projectId=PROJECT_UUID" \
  -F "module=geotech"

# 5. Trigger Analysis
curl -X POST http://localhost:8080/api/analyze/geotech \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"DOCUMENT_UUID"}'

# 6. Get Report (poll until status=SUCCESS)
curl http://localhost:8080/api/reports/REPORT_UUID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🛠️ Tech Stack

### AI Gateway
- **FastAPI** - Web framework
- **Groq** - Primary LLM (LLaMA 3.3 70B)
- **Google Gemini** - Fallback LLM + Vision
- **HuggingFace** - Secondary fallback (Mistral 7B)
- **FAISS** - Vector search
- **Sentence Transformers** - Embeddings

### Backend
- **Spring Boot 3.2.5** - Framework
- **Java 21** - Language
- **PostgreSQL** - Database (Neon.tech)
- **MinIO** - File storage
- **JWT** - Authentication
- **Flyway** - Database migrations
- **WebClient** - HTTP client

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **Zustand** - State management
- **React Router** - Routing
- **React Dropzone** - File uploads
- **Axios** - HTTP client

## 📦 Project Structure

```
civilai/
├── ai-gateway/          ✅ FastAPI service (complete)
│   ├── app/
│   │   ├── routers/     # 6 analysis modules
│   │   ├── services/    # LLM chain, PDF parser, vector store
│   │   └── models/      # Pydantic schemas
│   └── requirements.txt
├── backend/             ✅ Spring Boot (complete)
│   ├── src/main/java/com/civilai/
│   │   ├── auth/        # Authentication
│   │   ├── user/        # User management
│   │   ├── project/     # Project CRUD
│   │   ├── document/    # File management
│   │   ├── report/      # Analysis results
│   │   ├── analysis/    # Analysis orchestration
│   │   ├── storage/     # MinIO service
│   │   ├── gateway/     # AI Gateway client
│   │   └── config/      # Configuration
│   └── pom.xml
├── frontend/            ✅ React app (complete)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # API client
│   │   └── store/       # State management
│   └── package.json
└── docs/                📚 Documentation
```

## 🎯 Next Steps

1. **Testing** (2-3 days)
   - Unit tests
   - Integration tests
   - End-to-end tests

2. **Deployment** (1-2 days)
   - Frontend → Vercel/Netlify
   - Backend → Render.com
   - AI Gateway → Render.com
   - Database → Neon.tech (already cloud)
   - MinIO → Cloud storage (S3/R2)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

- Check documentation in `/docs`
- Open an issue on GitHub
- Email: support@civilai.com

## 🙏 Acknowledgments

- Groq for fast LLM inference
- Google for Gemini API
- Neon for serverless PostgreSQL
- Spring Boot team
- FastAPI team

---

**Built with ❤️ for civil engineers**
