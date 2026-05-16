<div align="center">

# 🏗️ CivilAI

### AI-Powered Analysis Platform for Civil Engineering

*Automate civil engineering workflows with Large Language Models and RAG*

[![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen?style=for-the-badge&logo=spring)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-teal?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [API](#-api-documentation) • [Tech Stack](#-tech-stack)

</div>

---

## 🎯 What is CivilAI?

CivilAI is an intelligent platform that leverages **Large Language Models (LLMs)** with **fallback chains** and **Retrieval-Augmented Generation (RAG)** to automate complex civil engineering tasks. Built for engineers, by engineers.

### 🌟 Key Highlights

- 🤖 **Multi-LLM Fallback Chain**: Groq → Gemini → HuggingFace for 99.9% uptime
- 📚 **RAG-Powered**: Vector search through Indian Standard (IS) Codes
- 🔒 **Enterprise-Ready**: JWT authentication, role-based access, audit trails
- 📊 **6 Specialized Modules**: From geotechnical analysis to site safety
- ⚡ **Real-Time Processing**: Async analysis with WebSocket updates
- 🎨 **Modern UI**: Beautiful React interface with TailwindCSS

---

## ✨ Features

### 🏗️ Core Modules

<table>
<tr>
<td width="50%">

#### 🌍 Geotechnical Analysis
- Extract soil profiles from borehole logs
- Calculate bearing capacity
- Identify soil layers and properties
- Generate foundation recommendations

#### 📋 BOQ Generation
- Auto-generate Bill of Quantities
- CPWD rate integration
- Material quantity estimation
- Cost breakdown analysis

#### 📖 IS Code Compliance
- Check designs against Indian Standards
- RAG-powered code search
- Compliance verification
- Recommendation engine

</td>
<td width="50%">

#### 🏢 Structural Calculations
- Dead load & live load computation
- Seismic analysis (IS 1893)
- Wind load calculation (IS 875)
- Load combination generation

#### 📄 Tender Analysis
- Extract key dates and deadlines
- Identify eligibility criteria
- Risk assessment
- Requirement summarization

#### 📸 Site Safety Analysis
- Analyze construction photos
- Detect safety hazards
- PPE compliance checking
- Safety recommendations

</td>
</tr>
</table>

### 🔐 Security & Authentication

- ✅ JWT-based authentication
- ✅ Email verification with OTP
- ✅ Password reset flow
- ✅ Role-based access control
- ✅ Secure file storage (MinIO/S3)

### 📊 Project Management

- ✅ Multi-project organization
- ✅ Document management
- ✅ Analysis history tracking
- ✅ LLM audit trails
- ✅ Report generation

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                    │
│              Modern UI with TailwindCSS & Zustand           │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (JWT Auth)
┌────────────────────────▼────────────────────────────────────┐
│                  Spring Boot Backend (Java 21)              │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │   Auth   │ Projects │Documents │ Analysis │ Reports  │  │
│  │  Users   │   CRUD   │  Upload  │  Async   │  Audit   │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└──────┬────────────────────────────────────────────┬─────────┘
       │ WebClient                                  │ MinIO API
       │                                            │
┌──────▼────────────────────────┐          ┌───────▼──────────┐
│   FastAPI AI Gateway          │          │  File Storage    │
│  ┌─────────────────────────┐  │          │  (MinIO/S3)      │
│  │  LLM Fallback Chain     │  │          │  PDFs, Images    │
│  │  Groq → Gemini → HF     │  │          └──────────────────┘
│  └─────────────────────────┘  │
│  ┌─────────────────────────┐  │          ┌──────────────────┐
│  │  Vector Store (FAISS)   │  │          │  PostgreSQL      │
│  │  IS Code Database       │  │          │  (Neon.tech)     │
│  │  Sentence Transformers  │  │          │  Users, Projects │
│  └─────────────────────────┘  │          │  Documents, etc. │
└───────────────────────────────┘          └──────────────────┘
```

### 🔄 Request Flow

```
User → Frontend → Backend → AI Gateway → LLM APIs
                     ↓           ↓
                  Database   Vector Store
                     ↓
                  MinIO/S3
```

---

## 🚀 Quick Start

### Prerequisites

- **Java 21** or higher
- **Maven 3.8+**
- **Node.js 20+**
- **Python 3.11+**
- **Docker** (for MinIO)
- **PostgreSQL** (or use Neon.tech)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Thoshanth/Civil-Ai.git
cd Civil-Ai
```

### 2️⃣ Setup Database

**Option A: Neon.tech (Recommended)**
```bash
# Sign up at https://neon.tech
# Create project: civilai
# Copy connection string
```

**Option B: Local PostgreSQL**
```bash
createdb civilai
```

### 3️⃣ Setup MinIO (File Storage)

```bash
docker run -d \
  --name civilai-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  minio/minio server /data --console-address ":9001"
```

**Create bucket:**
1. Open http://localhost:9001
2. Login: `minioadmin` / `minioadmin123`
3. Create bucket: `civilai-files`

### 4️⃣ Configure Environment Variables

**AI Gateway** (`ai-gateway/.env`):
```bash
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
HF_TOKEN=your_huggingface_token
```

**Backend** (`backend/.env`):
```bash
DB_HOST=your-db-host:5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_SSL_MODE=require

MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=civilai-files

AI_SERVICE_URL=http://localhost:8000
JWT_SECRET=your_secret_key_minimum_32_characters
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

### 5️⃣ Start Services

**Terminal 1 - AI Gateway:**
```bash
cd ai-gateway
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Backend:**
```bash
cd backend
mvn spring-boot:run
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 6️⃣ Access Application

- 🌐 **Frontend**: http://localhost:5173
- 🔧 **Backend API**: http://localhost:8080
- 🤖 **AI Gateway**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8080/swagger-ui
- 📖 **AI Docs**: http://localhost:8000/docs

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login with credentials |
| `POST` | `/api/auth/verify-otp` | Verify email OTP |
| `POST` | `/api/auth/forgot-password` | Request password reset |
| `POST` | `/api/auth/reset-password` | Reset password with OTP |

### Project Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create new project |
| `GET` | `/api/projects/{id}` | Get project details |
| `PUT` | `/api/projects/{id}` | Update project |
| `DELETE` | `/api/projects/{id}` | Delete project |

### Document Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/documents/upload` | Upload document |
| `GET` | `/api/documents/project/{id}` | List project documents |
| `GET` | `/api/documents/{id}` | Get document details |
| `GET` | `/api/documents/{id}/download-url` | Get download URL |
| `DELETE` | `/api/documents/{id}` | Delete document |

### Analysis Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze/{module}` | Analyze document |
| `POST` | `/api/analyze/{module}/json` | Analyze JSON data |

**Modules**: `geotech`, `boq`, `iscode`, `structural`, `tender`, `site-photo`

### Report Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/{id}` | Get report by ID |
| `GET` | `/api/reports/document/{id}` | List document reports |
| `GET` | `/api/reports/module/{module}` | List module reports |
| `GET` | `/api/reports/{id}/audit` | Get LLM audit trail |

---

## 🧪 Example Usage

### Register User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "engineer@example.com",
    "password": "SecurePass123!",
    "fullName": "John Engineer"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "engineer@example.com",
    "password": "SecurePass123!"
  }'
```

### Create Project
```bash
curl -X POST http://localhost:8080/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Highway Expansion Project",
    "description": "NH-44 widening from 2-lane to 4-lane"
  }'
```

### Upload & Analyze Document
```bash
# Upload
curl -X POST http://localhost:8080/api/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@borehole_report.pdf" \
  -F "projectId=PROJECT_UUID" \
  -F "module=geotech"

# Analyze
curl -X POST http://localhost:8080/api/analyze/geotech \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentId": "DOCUMENT_UUID"}'

# Get Results
curl http://localhost:8080/api/reports/REPORT_UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility-first CSS
- **Zustand** - State management
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **React Dropzone** - File uploads

### Backend
- **Spring Boot 3.2.5** - Application framework
- **Java 21** - Programming language
- **PostgreSQL** - Relational database
- **Flyway** - Database migrations
- **Spring Security** - Authentication & authorization
- **JWT** - Token-based auth
- **WebClient** - Reactive HTTP client
- **MinIO** - S3-compatible object storage
- **Lombok** - Boilerplate reduction

### AI Gateway
- **FastAPI** - Web framework
- **Python 3.11** - Programming language
- **Groq** - Primary LLM (LLaMA 3.3 70B)
- **Google Gemini** - Fallback LLM + Vision
- **HuggingFace** - Secondary fallback (Mistral 7B)
- **FAISS** - Vector similarity search
- **Sentence Transformers** - Text embeddings
- **PyPDF2** - PDF text extraction
- **Pillow** - Image processing
- **Pydantic** - Data validation

### DevOps & Tools
- **Docker** - Containerization
- **Maven** - Java build tool
- **npm** - JavaScript package manager
- **Git** - Version control

---

## 📁 Project Structure

```
civilai/
├── ai-gateway/              # FastAPI AI service
│   ├── app/
│   │   ├── routers/         # API endpoints (6 modules)
│   │   ├── services/        # Business logic
│   │   │   ├── llm_chain.py      # LLM fallback chain
│   │   │   ├── pdf_parser.py     # PDF processing
│   │   │   └── vector_store.py   # RAG/vector search
│   │   └── models/          # Pydantic schemas
│   ├── requirements.txt
│   └── Dockerfile
│
├── backend/                 # Spring Boot API
│   ├── src/main/java/com/civilai/
│   │   ├── auth/            # Authentication
│   │   ├── user/            # User management
│   │   ├── project/         # Project CRUD
│   │   ├── document/        # File management
│   │   ├── analysis/        # Analysis orchestration
│   │   ├── report/          # Results & audit
│   │   ├── storage/         # MinIO integration
│   │   ├── gateway/         # AI Gateway client
│   │   ├── email/           # Email service
│   │   ├── otp/             # OTP management
│   │   └── config/          # Configuration
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/    # Flyway migrations
│   └── pom.xml
│
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── layout/      # Layout components
│   │   │   └── ui/          # UI components
│   │   ├── pages/           # Page components
│   │   │   ├── auth/        # Auth pages
│   │   │   └── modules/     # Module pages
│   │   ├── lib/             # API client
│   │   ├── store/           # Zustand stores
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── README.md
└── QUICK_START.md
```

---

## 🔧 Configuration

### Database Configuration

**Neon.tech (Recommended for production):**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://your-project.neon.tech/neondb?sslmode=require
    username: your_username
    password: your_password
```

**Local PostgreSQL:**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/civilai
    username: postgres
    password: postgres
```

### MinIO Configuration

**Local:**
```yaml
minio:
  endpoint: http://localhost:9000
  access-key: minioadmin
  secret-key: minioadmin123
  bucket: civilai-files
```

**Production (S3/R2):**
```yaml
minio:
  endpoint: https://your-bucket.r2.cloudflarestorage.com
  access-key: your_access_key
  secret-key: your_secret_key
  bucket: civilai-files
```

### LLM API Keys

Get your free API keys:
- **Groq**: https://console.groq.com (14,400 req/day)
- **Gemini**: https://aistudio.google.com/app/apikey (1,500 req/day)
- **HuggingFace**: https://huggingface.co/settings/tokens (rate limited)

---

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
mvn test
```

### Run AI Gateway Tests
```bash
cd ai-gateway
pytest
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

---

## 📊 Performance

- **API Response Time**: 100-500ms
- **LLM Inference**: 2-10 seconds
- **File Upload**: 1-5 seconds (depends on size)
- **PDF Analysis**: 10-30 seconds
- **Concurrent Users**: 100+ (with proper scaling)

---

## 🔒 Security

- ✅ JWT-based authentication
- ✅ Password hashing (BCrypt)
- ✅ CORS configuration
- ✅ SQL injection prevention (JPA)
- ✅ XSS protection
- ✅ HTTPS enforcement (production)
- ✅ Rate limiting (planned)
- ✅ Input validation
- ✅ Secure file storage

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write tests for new features
- Update documentation
- Keep commits atomic and descriptive

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Groq** - Fast LLM inference
- **Google** - Gemini API
- **HuggingFace** - Open-source models
- **Neon** - Serverless PostgreSQL
- **Spring Boot** - Excellent framework
- **FastAPI** - Modern Python web framework
- **React** - Powerful UI library

---

## 📞 Support

- 📧 **Email**: support@civilai.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/Thoshanth/Civil-Ai/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Thoshanth/Civil-Ai/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/Thoshanth/Civil-Ai/wiki)

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Integration with CAD software
- [ ] Multi-language support
- [ ] Offline mode
- [ ] API rate limiting
- [ ] Webhook support
- [ ] Custom LLM fine-tuning
- [ ] Enterprise SSO

---

<div align="center">

### ⭐ Star us on GitHub!

If you find CivilAI useful, please consider giving it a star. It helps us grow! 🚀

**Built with ❤️ for civil engineers**

[⬆ Back to Top](#-civilai)

</div>
