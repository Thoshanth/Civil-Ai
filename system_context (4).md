# CivilAI — System Context Document
> Version 2.0 | Updated: May 2026
> Status: AI Service ✅ DONE | Backend 🔨 TO BUILD | Frontend 🔨 TO BUILD

---

## 1. What's Already Built (Your AI Service)

Your **FastAPI AI microservice** is complete and production-ready:

| Component | Status | Details |
|-----------|--------|---------|
| LLM Fallback Chain | ✅ Done | Groq → Gemini → HuggingFace |
| RAG (IS Codes) | ✅ Done | FAISS + Sentence Transformers |
| PDF Parser | ✅ Done | PyMuPDF + pdfplumber |
| Geotechnical module | ✅ Done | `/api/geotech/analyze` |
| BOQ Estimator | ✅ Done | `/api/boq/analyze` |
| IS Code Compliance | ✅ Done | `/api/iscode/query` + `/check` |
| Structural Loads | ✅ Done | `/api/structural/calculate` |
| Tender Analysis | ✅ Done | `/api/tender/analyze` |
| Site Photo Analysis | ✅ Done | `/api/site_photo/analyze` |

**What's missing:** A proper backend (auth, file storage, project management, API gateway)
and a frontend (UI for civil engineers to actually use the platform).

---

## 2. Full System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (Vite)                        │
│         Civil engineers upload files, view results              │
│              Port 5173 (dev) / Vercel (prod)                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST + SSE streaming
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              JAVA SPRING BOOT BACKEND (Port 8080)               │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Auth/JWT   │  │ File Handler │  │   Module Controllers  │  │
│  │  (Security) │  │   (MinIO)    │  │  geotech/boq/tender.. │  │
│  └─────────────┘  └──────────────┘  └───────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           AI Gateway (Spring WebClient)                  │   │
│  │     Proxies all requests → FastAPI AI Service            │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────┬────────────────────────┬────────────────────────┘
               │                        │
               ▼                        ▼
┌──────────────────────┐   ┌────────────────────────────────────┐
│  Neon PostgreSQL      │   │   FastAPI AI Service (Port 8000)   │
│  (Free, never sleeps) │   │   YOUR EXISTING CODE ✅            │
│  Users, projects,     │   │   Groq → Gemini → HuggingFace     │
│  reports, audit logs  │   │   FAISS RAG + PDF + Vision        │
└──────────────────────┘   └────────────────────────────────────┘
                                        │
                           ┌────────────▼───────────────┐
                           │  MinIO (Self-Hosted S3)     │
                           │  Free, Docker container     │
                           │  Stores PDFs, images, DWGs  │
                           └────────────────────────────┘
```

---

## 3. Technology Choices — All Free

### Why NOT Supabase
Supabase free tier pauses the database after 1 week of inactivity, has limited storage,
and the built-in auth conflicts with Spring Security JWT. Not suitable here.

### Database — Neon PostgreSQL ✅ BEST FREE CHOICE
| Feature | Detail |
|---------|--------|
| Provider | neon.tech |
| Cost | Free forever (0.5GB) |
| Type | Serverless PostgreSQL — never sleeps |
| Why best | Instant connection, works with Spring JPA via JDBC URL directly |
| Spring URL | `jdbc:postgresql://<host>/civilai?sslmode=require` |

### File Storage — MinIO ✅ BEST FREE CHOICE
| Feature | Detail |
|---------|--------|
| Cost | 100% free, self-hosted via Docker |
| S3 Compatible | Yes — same API as AWS S3 |
| Why | Civil files are large (PDFs, photos, DWGs) — cloud free tiers are tiny |
| Java SDK | `io.minio:minio:8.5.7` |
| Start locally | `docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"` |

### Frontend Stack
| Tool | Version | Purpose | Cost |
|------|---------|---------|------|
| React | 18 | UI framework | Free |
| Vite | 5 | Fast build + dev server | Free |
| TailwindCSS | 3 | Utility styling | Free |
| shadcn/ui | latest | Pre-built UI components | Free |
| React Query | 5 | Data fetching + caching | Free |
| Zustand | 4 | Auth & global state | Free |
| React Dropzone | — | Drag & drop uploads | Free |
| React PDF | 7 | View PDFs in browser | Free |
| Axios | — | HTTP client | Free |
| React Router | 6 | Page navigation | Free |

### Java Backend Stack
| Tool | Purpose | Cost |
|------|---------|------|
| Spring Boot 3.2 | Main framework | Free |
| Spring Security 6 | JWT auth + route protection | Free |
| Spring Data JPA | ORM → Neon PostgreSQL | Free |
| Spring WebClient | Async calls to FastAPI | Free |
| Spring WebFlux | SSE streaming to frontend | Free |
| Flyway | DB schema migrations | Free |
| Lombok | Reduce boilerplate | Free |
| MapStruct | DTO ↔ Entity mapping | Free |
| MinIO SDK | File upload/download | Free |
| SpringDoc OpenAPI | Auto API docs at /swagger-ui | Free |
| PostgreSQL JDBC | DB driver | Free |

---

## 4. Database Schema (Neon PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,        -- BCrypt hashed
    full_name   VARCHAR(255),
    role        VARCHAR(50) DEFAULT 'USER',   -- USER | ADMIN
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Projects (groups work by site/client)
CREATE TABLE projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Uploaded files (stored in MinIO, metadata here)
CREATE TABLE documents (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_name    VARCHAR(500) NOT NULL,
    minio_key    TEXT NOT NULL,               -- MinIO object key
    file_type    VARCHAR(50),                 -- pdf | jpg | png
    module       VARCHAR(100),               -- geotech | boq | structural | ...
    file_size_kb INTEGER,
    uploaded_at  TIMESTAMP DEFAULT NOW()
);

-- AI analysis reports
CREATE TABLE reports (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id   UUID REFERENCES documents(id) ON DELETE SET NULL,
    module        VARCHAR(100) NOT NULL,
    status        VARCHAR(50) DEFAULT 'PENDING', -- PENDING | SUCCESS | FAILED
    result_json   JSONB,                          -- Full AI JSON response
    llm_used      VARCHAR(100),                  -- groq | gemini | huggingface
    tokens_used   INTEGER,
    error_message TEXT,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- LLM fallback audit trail
CREATE TABLE llm_audit (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id       UUID REFERENCES reports(id) ON DELETE CASCADE,
    provider_tried  VARCHAR(100),
    success         BOOLEAN,
    fallback_reason TEXT,
    latency_ms      INTEGER,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_reports_document ON reports(document_id);
CREATE INDEX idx_reports_status ON reports(status);
```

---

## 5. Java Backend — Full Folder Structure

```
backend/
├── pom.xml
└── src/
    └── main/
        ├── java/com/civilai/
        │   │
        │   ├── CivilAiApplication.java          # Main entry point
        │   │
        │   ├── config/
        │   │   ├── SecurityConfig.java           # JWT filter + CORS
        │   │   ├── WebClientConfig.java          # HTTP client bean
        │   │   └── MinioConfig.java              # MinIO client bean
        │   │
        │   ├── auth/
        │   │   ├── AuthController.java           # /api/auth/register, /login
        │   │   ├── AuthService.java
        │   │   ├── dto/LoginRequest.java
        │   │   ├── dto/RegisterRequest.java
        │   │   ├── dto/AuthResponse.java         # { token, user }
        │   │   └── JwtUtil.java
        │   │
        │   ├── user/
        │   │   ├── UserController.java           # GET /api/users/me
        │   │   ├── UserService.java
        │   │   ├── UserEntity.java
        │   │   └── UserRepository.java
        │   │
        │   ├── project/
        │   │   ├── ProjectController.java        # CRUD /api/projects
        │   │   ├── ProjectService.java
        │   │   ├── ProjectEntity.java
        │   │   ├── ProjectRepository.java
        │   │   └── dto/ProjectDTO.java
        │   │
        │   ├── document/
        │   │   ├── DocumentController.java       # POST /api/documents/upload
        │   │   ├── DocumentService.java          # Saves to MinIO + DB
        │   │   ├── DocumentEntity.java
        │   │   ├── DocumentRepository.java
        │   │   └── dto/DocumentDTO.java
        │   │
        │   ├── analysis/
        │   │   ├── AnalysisController.java       # POST /api/analyze/{module}
        │   │   ├── AnalysisService.java          # Calls FastAPI, saves report
        │   │   ├── ReportEntity.java
        │   │   ├── ReportRepository.java
        │   │   ├── LlmAuditEntity.java
        │   │   ├── LlmAuditRepository.java
        │   │   └── dto/ReportDTO.java
        │   │
        │   ├── gateway/
        │   │   └── AiGatewayService.java         # WebClient → FastAPI
        │   │
        │   └── storage/
        │       └── MinioService.java             # Upload / presigned URL
        │
        └── resources/
            ├── application.yml
            └── db/migration/
                └── V1__init.sql                  # Flyway schema
```

---

## 6. React Frontend — Full Folder Structure

```
frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── src/
    ├── App.jsx                              # Routes setup
    ├── main.jsx
    │
    ├── pages/
    │   ├── auth/
    │   │   ├── LoginPage.jsx
    │   │   └── RegisterPage.jsx
    │   ├── DashboardPage.jsx                # Projects list + stats
    │   ├── ProjectPage.jsx                  # Project detail + reports
    │   └── modules/
    │       ├── GeotechnicalPage.jsx         # Upload borehole PDF
    │       ├── BOQPage.jsx                  # Upload drawing/BOQ
    │       ├── ISCodePage.jsx               # Ask IS code question (no file)
    │       ├── StructuralPage.jsx           # Form (floors, zone, area)
    │       ├── TenderPage.jsx               # Upload tender PDF
    │       └── SiteInspectionPage.jsx       # Upload site photo
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.jsx
    │   │   ├── Navbar.jsx
    │   │   └── Layout.jsx
    │   ├── FileUpload.jsx                   # Drag & drop reusable
    │   ├── ReportViewer.jsx                 # Renders result_json nicely
    │   ├── ReportCard.jsx                   # Summary card in list
    │   ├── LLMBadge.jsx                     # Shows "Groq" / "Gemini" badge
    │   └── StatusBadge.jsx                  # PENDING / SUCCESS / FAILED
    │
    ├── api/
    │   ├── client.js                        # Axios instance with JWT header
    │   ├── auth.js                          # login(), register()
    │   ├── projects.js                      # getProjects(), createProject()
    │   ├── documents.js                     # uploadFile()
    │   └── analysis.js                      # triggerAnalysis(), getReport()
    │
    ├── hooks/
    │   ├── useAuth.js
    │   └── useAnalysis.js
    │
    └── store/
        └── authStore.js                     # Zustand: token + user
```

---

## 7. API Contract (Java Backend ↔ React)

```
AUTH
POST  /api/auth/register     { email, password, fullName }  →  { token, user }
POST  /api/auth/login        { email, password }            →  { token, user }
GET   /api/users/me          Header: Bearer <token>         →  { id, email, fullName }

PROJECTS
GET   /api/projects                          →  [ { id, name, createdAt } ]
POST  /api/projects          { name, desc }  →  { id, name }
DELETE /api/projects/{id}

FILE UPLOAD
POST  /api/documents/upload
      multipart: file + projectId + module   →  { documentId, fileName }

AI ANALYSIS TRIGGERS
POST  /api/analyze/geotech        { documentId }            →  { reportId }
POST  /api/analyze/boq            { documentId }            →  { reportId }
POST  /api/analyze/structural     { floors, zone, area.. }  →  { reportId }
POST  /api/analyze/iscode/query   { question }              →  { answer, references }
POST  /api/analyze/iscode/check   { parameters, codes }     →  { status, checks }
POST  /api/analyze/tender         { documentId }            →  { reportId }
POST  /api/analyze/site-photo     { documentId }            →  { reportId }

REPORTS
GET   /api/reports/{reportId}              →  { status, resultJson, llmUsed, createdAt }
GET   /api/reports/project/{projectId}     →  [ { id, module, status, createdAt } ]
```

---

## 8. How Java Calls Your FastAPI (AiGatewayService.java)

```java
@Service
@RequiredArgsConstructor
public class AiGatewayService {

    private final WebClient webClient;  // base URL = http://localhost:8000

    // Modules that accept a PDF file
    public Mono<String> analyzeWithFile(String endpoint, byte[] fileBytes, String fileName) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", fileBytes)
               .filename(fileName)
               .contentType(MediaType.APPLICATION_PDF);

        return webClient.post()
            .uri(endpoint)
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(BodyInserters.fromMultipartData(builder.build()))
            .retrieve()
            .bodyToMono(String.class)
            .timeout(Duration.ofSeconds(90));
    }

    // Modules that take JSON input (structural, iscode/query)
    public Mono<String> analyzeWithJson(String endpoint, Object requestBody) {
        return webClient.post()
            .uri(endpoint)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(String.class)
            .timeout(Duration.ofSeconds(60));
    }
}
```

---

## 9. application.yml

```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}/civilai?sslmode=require
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate.dialect: org.hibernate.dialect.PostgreSQLDialect
  flyway:
    enabled: true
    locations: classpath:db/migration

minio:
  endpoint: http://localhost:9000
  access-key: ${MINIO_ACCESS_KEY}
  secret-key: ${MINIO_SECRET_KEY}
  bucket: civilai-files

ai:
  service:
    base-url: ${AI_SERVICE_URL:http://localhost:8000}

jwt:
  secret: ${JWT_SECRET}
  expiration-ms: 86400000   # 24 hours

server:
  port: 8080

springdoc:
  swagger-ui:
    path: /swagger-ui
```

---

## 10. pom.xml — Key Dependencies

```xml
<dependencies>
  <!-- Spring Boot -->
  <dependency><groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId></dependency>
  <dependency><groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId></dependency>
  <dependency><groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId></dependency>
  <dependency><groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId></dependency>
  <dependency><groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId></dependency>

  <!-- PostgreSQL + Flyway -->
  <dependency><groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId></dependency>
  <dependency><groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId></dependency>

  <!-- JWT -->
  <dependency><groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId><version>0.12.5</version></dependency>
  <dependency><groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId><version>0.12.5</version></dependency>
  <dependency><groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId><version>0.12.5</version></dependency>

  <!-- MinIO -->
  <dependency><groupId>io.minio</groupId>
    <artifactId>minio</artifactId><version>8.5.7</version></dependency>

  <!-- OpenAPI Docs -->
  <dependency><groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version></dependency>

  <!-- Lombok + MapStruct -->
  <dependency><groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId><optional>true</optional></dependency>
  <dependency><groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId><version>1.5.5.Final</version></dependency>
</dependencies>
```

---

## 11. Environment Variables

### FastAPI AI Service (.env) — already have this
```env
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
HUGGINGFACE_API_KEY=hf_...
```

### Java Backend (.env)
```env
DB_HOST=<your-neon-host>.neon.tech
DB_USERNAME=civilai_owner
DB_PASSWORD=<neon-password>
JWT_SECRET=civilai_super_secret_key_32_chars_min
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
AI_SERVICE_URL=http://localhost:8000
```

### React Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8080
```

---

## 12. Local Dev Ports

| Service | Port | Start Command |
|---------|------|--------------|
| React (Vite) | 5173 | `npm run dev` |
| Spring Boot | 8080 | `mvn spring-boot:run` |
| FastAPI (yours) | 8000 | `uvicorn main:app --reload` |
| MinIO API | 9000 | `docker run minio/minio ...` |
| MinIO Console | 9001 | (same docker container) |
| Neon PostgreSQL | cloud | (connect via JDBC URL) |

---

## 13. Free Hosting Options (When Ready to Deploy)

| Service | Provider | Free Tier | Best For |
|---------|----------|-----------|---------|
| React frontend | Vercel | Unlimited | Static hosting |
| Spring Boot | Render.com | 750 hrs/month (sleeps) | Backend API |
| FastAPI AI service | Render.com | 750 hrs/month (sleeps) | AI endpoints |
| PostgreSQL | Neon.tech | 0.5GB, never sleeps | Database |
| MinIO | Railway.app | $5 credit/month | File storage |

> Note: Free tiers on Render spin down after 15 min inactivity (cold start ~30s).
> Acceptable for a demo/MVP, upgrade when you have users.
