# CivilAI — Implementation Guide
> Build order: Database → Java Backend → React Frontend → Integration → Deploy
> AI Service is already done ✅ — this guide builds everything around it.

---

## Phase 0 — Prerequisites & Setup

### Tools to Install
```bash
# Java 21
# Download from https://adoptium.net (Temurin 21 LTS)
java -version   # should show 21

# Maven
mvn -version

# Node.js 20+
node -v

# Docker (for MinIO)
docker -v

# Your existing Python + FastAPI setup already works ✅
```

### Free Accounts to Create (Before Starting)
1. **Neon.tech** → https://neon.tech → Create project → Copy connection string
2. **Groq** → https://console.groq.com → Already have API key ✅
3. **Google AI Studio** → https://aistudio.google.com → Already have API key ✅
4. **Vercel** → https://vercel.com → For frontend deploy later
5. **Render.com** → https://render.com → For backend deploy later

---

## Phase 1 — Database Setup (Neon PostgreSQL)

### Step 1.1 — Create Neon Database
```
1. Go to https://neon.tech
2. Sign up free → Create project "civilai"
3. Note your connection string:
   postgresql://civilai_owner:<password>@<host>.neon.tech/civilai?sslmode=require
4. In Neon dashboard → SQL Editor → run the schema below
```

### Step 1.2 — Run Schema
Copy the full SQL from `system_context.md` Section 4 and run it in Neon SQL Editor.
All tables (users, projects, documents, reports, llm_audit) will be created.

---

## Phase 2 — MinIO File Storage (Docker)

### Step 2.1 — Start MinIO Locally
```bash
docker run -d \
  --name civilai-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  -v ~/minio-data:/data \
  minio/minio server /data --console-address ":9001"
```

### Step 2.2 — Create Bucket
```
1. Open http://localhost:9001
2. Login: minioadmin / minioadmin123
3. Create bucket: "civilai-files"
4. Set access policy to private
```

---

## Phase 3 — Java Spring Boot Backend

### Step 3.1 — Create Project
Go to https://start.spring.io and generate with:
- Project: Maven | Language: Java | Spring Boot: 3.2.x
- Group: `com.civilai` | Artifact: `backend`
- Java: 21
- Dependencies: Spring Web, Spring Security, Spring Data JPA,
  Spring WebFlux, Flyway Migration, Lombok, Validation, PostgreSQL Driver

Or use this command:
```bash
curl https://start.spring.io/starter.zip \
  -d dependencies=web,security,data-jpa,webflux,flyway,lombok,validation,postgresql \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=3.2.5 \
  -d groupId=com.civilai \
  -d artifactId=backend \
  -d javaVersion=21 \
  -o civilai-backend.zip

unzip civilai-backend.zip -d backend
```

### Step 3.2 — Add Extra Dependencies to pom.xml
Add these inside `<dependencies>` in pom.xml:

```xml
<!-- JWT -->
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-api</artifactId>
  <version>0.12.5</version>
</dependency>
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-impl</artifactId>
  <version>0.12.5</version>
  <scope>runtime</scope>
</dependency>
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-jackson</artifactId>
  <version>0.12.5</version>
  <scope>runtime</scope>
</dependency>

<!-- MinIO -->
<dependency>
  <groupId>io.minio</groupId>
  <artifactId>minio</artifactId>
  <version>8.5.7</version>
</dependency>

<!-- OpenAPI Swagger UI -->
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
  <version>2.3.0</version>
</dependency>

<!-- MapStruct -->
<dependency>
  <groupId>org.mapstruct</groupId>
  <artifactId>mapstruct</artifactId>
  <version>1.5.5.Final</version>
</dependency>
<dependency>
  <groupId>org.mapstruct</groupId>
  <artifactId>mapstruct-processor</artifactId>
  <version>1.5.5.Final</version>
  <scope>provided</scope>
</dependency>
```

### Step 3.3 — application.yml
Replace `src/main/resources/application.properties` with `application.yml`:

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
  access-key: ${MINIO_ACCESS_KEY:minioadmin}
  secret-key: ${MINIO_SECRET_KEY:minioadmin123}
  bucket: ${MINIO_BUCKET:civilai-files}

ai:
  service:
    base-url: ${AI_SERVICE_URL:http://localhost:8000}

jwt:
  secret: ${JWT_SECRET:civilai_dev_secret_key_minimum_32_chars}
  expiration-ms: 86400000

server:
  port: 8080

springdoc:
  swagger-ui:
    path: /swagger-ui
```

### Step 3.4 — Flyway Migration File
Create `src/main/resources/db/migration/V1__init.sql` — paste the full SQL schema
from `system_context.md` Section 4. Flyway runs this automatically on startup.

### Step 3.5 — Build the Backend Layer by Layer

**Order to implement classes:**

```
1. config/
   ├── MinioConfig.java
   ├── WebClientConfig.java
   └── SecurityConfig.java        ← do this last in config

2. auth/
   ├── JwtUtil.java               ← token generate + validate
   ├── dto/ (LoginRequest, RegisterRequest, AuthResponse)
   ├── AuthService.java
   └── AuthController.java

3. user/
   ├── UserEntity.java            ← JPA entity with UUID id
   ├── UserRepository.java        ← extends JpaRepository
   ├── UserService.java
   └── UserController.java        ← GET /api/users/me

4. project/
   ├── ProjectEntity.java
   ├── ProjectRepository.java
   ├── ProjectService.java
   └── ProjectController.java     ← CRUD /api/projects

5. storage/
   └── MinioService.java          ← uploadFile(), getPresignedUrl()

6. document/
   ├── DocumentEntity.java
   ├── DocumentRepository.java
   ├── DocumentService.java       ← calls MinioService
   └── DocumentController.java    ← POST /api/documents/upload

7. gateway/
   └── AiGatewayService.java      ← WebClient to FastAPI

8. analysis/
   ├── ReportEntity.java
   ├── LlmAuditEntity.java
   ├── ReportRepository.java
   ├── LlmAuditRepository.java
   ├── AnalysisService.java       ← calls AiGatewayService, saves report
   └── AnalysisController.java    ← POST /api/analyze/{module}
```

### Step 3.6 — Key Implementation Snippets

**JwtUtil.java**
```java
@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    public String generateToken(String email) {
        return Jwts.builder()
            .subject(email)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(Keys.hmacShaKeyFor(secret.getBytes()))
            .compact();
    }

    public String extractEmail(String token) {
        return Jwts.parser()
            .verifyWith(Keys.hmacShaKeyFor(secret.getBytes()))
            .build()
            .parseSignedClaims(token)
            .getPayload()
            .getSubject();
    }
}
```

**MinioService.java**
```java
@Service
@RequiredArgsConstructor
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    public String uploadFile(MultipartFile file, String objectKey) throws Exception {
        minioClient.putObject(PutObjectArgs.builder()
            .bucket(bucket)
            .object(objectKey)
            .stream(file.getInputStream(), file.getSize(), -1)
            .contentType(file.getContentType())
            .build());
        return objectKey;
    }

    public InputStream downloadFile(String objectKey) throws Exception {
        return minioClient.getObject(GetObjectArgs.builder()
            .bucket(bucket)
            .object(objectKey)
            .build());
    }

    public String getPresignedUrl(String objectKey) throws Exception {
        return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
            .bucket(bucket)
            .object(objectKey)
            .method(Method.GET)
            .expiry(1, TimeUnit.HOURS)
            .build());
    }
}
```

**AnalysisService.java — core flow**
```java
@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final AiGatewayService aiGateway;
    private final ReportRepository reportRepo;
    private final DocumentRepository documentRepo;
    private final MinioService minioService;
    private final LlmAuditRepository auditRepo;

    @Async
    public void analyzeDocument(UUID documentId, String module) {
        // 1. Create PENDING report
        ReportEntity report = ReportEntity.builder()
            .documentId(documentId)
            .module(module)
            .status("PENDING")
            .build();
        report = reportRepo.save(report);

        try {
            // 2. Get file from MinIO
            DocumentEntity doc = documentRepo.findById(documentId).orElseThrow();
            InputStream fileStream = minioService.downloadFile(doc.getMinioKey());
            byte[] fileBytes = fileStream.readAllBytes();

            // 3. Map module to FastAPI endpoint
            String endpoint = switch (module) {
                case "geotech"     -> "/api/geotech/analyze";
                case "boq"         -> "/api/boq/analyze";
                case "tender"      -> "/api/tender/analyze";
                case "site-photo"  -> "/api/site_photo/analyze";
                default -> throw new IllegalArgumentException("Unknown module: " + module);
            };

            // 4. Call FastAPI
            String result = aiGateway
                .analyzeWithFile(endpoint, fileBytes, doc.getFileName())
                .block();

            // 5. Parse which LLM was used from response JSON
            String llmUsed = extractLlmProvider(result);

            // 6. Save SUCCESS report
            report.setStatus("SUCCESS");
            report.setResultJson(result);
            report.setLlmUsed(llmUsed);
            reportRepo.save(report);

        } catch (Exception e) {
            report.setStatus("FAILED");
            report.setErrorMessage(e.getMessage());
            reportRepo.save(report);
        }
    }
}
```

### Step 3.7 — Test Backend
```bash
# Start MinIO first
docker start civilai-minio

# Start Spring Boot
cd backend
mvn spring-boot:run

# Test health
curl http://localhost:8080/actuator/health

# View Swagger UI
open http://localhost:8080/swagger-ui

# Register user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","fullName":"Test User"}'
```

---

## Phase 4 — React Frontend

### Step 4.1 — Create Project
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install

# Core dependencies
npm install axios react-router-dom @tanstack/react-query zustand react-dropzone

# UI
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# shadcn/ui
npx shadcn-ui@latest init

# PDF viewer
npm install react-pdf

# Icons
npm install lucide-react
```

### Step 4.2 — TailwindCSS Config
In `tailwind.config.js`:
```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

In `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 4.3 — Axios Client with JWT
Create `src/api/client.js`:
```js
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
})

// Auto-attach JWT to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('civilai_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-redirect to login on 401
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('civilai_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client
```

### Step 4.4 — Zustand Auth Store
Create `src/store/authStore.js`:
```js
import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('civilai_token') || null,
  user: null,

  login: (token, user) => {
    localStorage.setItem('civilai_token', token)
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('civilai_token')
    set({ token: null, user: null })
  },
}))
```

### Step 4.5 — API Functions
Create `src/api/analysis.js`:
```js
import client from './client'

export const uploadFile = (projectId, module, file) => {
  const form = new FormData()
  form.append('file', file)
  form.append('projectId', projectId)
  form.append('module', module)
  return client.post('/api/documents/upload', form)
}

export const triggerAnalysis = (module, documentId) =>
  client.post(`/api/analyze/${module}`, { documentId })

export const getReport = (reportId) =>
  client.get(`/api/reports/${reportId}`)

export const pollReport = async (reportId, intervalMs = 2000, maxWaitMs = 120000) => {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    const { data } = await getReport(reportId)
    if (data.status === 'SUCCESS' || data.status === 'FAILED') return data
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error('Analysis timed out')
}
```

### Step 4.6 — FileUpload Component
Create `src/components/FileUpload.jsx`:
```jsx
import { useDropzone } from 'react-dropzone'

export default function FileUpload({ onFile, accept, label }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => onFile(files[0]),
    accept,
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} />
      <p className="text-gray-500 text-sm">
        {isDragActive ? 'Drop file here...' : label || 'Drag & drop a file, or click to select'}
      </p>
    </div>
  )
}
```

### Step 4.7 — Module Page Pattern (e.g. GeotechnicalPage.jsx)
```jsx
import { useState } from 'react'
import FileUpload from '../../components/FileUpload'
import { uploadFile, triggerAnalysis, pollReport } from '../../api/analysis'

export default function GeotechnicalPage() {
  const [status, setStatus] = useState('idle') // idle | uploading | analyzing | done | error
  const [report, setReport] = useState(null)
  const projectId = 'YOUR_PROJECT_ID' // get from URL params

  const handleFile = async (file) => {
    try {
      setStatus('uploading')
      const { data: doc } = await uploadFile(projectId, 'geotech', file)

      setStatus('analyzing')
      const { data: { reportId } } = await triggerAnalysis('geotech', doc.documentId)

      const result = await pollReport(reportId)
      setReport(result)
      setStatus('done')
    } catch (e) {
      setStatus('error')
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-2">Geotechnical Analysis</h1>
      <p className="text-gray-500 mb-6">Upload a borehole log PDF — AI will extract soil profile,
        bearing capacity, and IS code recommendations.</p>

      <FileUpload
        onFile={handleFile}
        accept={{ 'application/pdf': ['.pdf'] }}
        label="Drop borehole log PDF here"
      />

      {status === 'uploading' && <p className="mt-4 text-blue-600">Uploading file...</p>}
      {status === 'analyzing' && <p className="mt-4 text-yellow-600">AI is analyzing... (may take 10-30s)</p>}
      {status === 'error' && <p className="mt-4 text-red-600">Something went wrong. Try again.</p>}

      {status === 'done' && report && (
        <div className="mt-6 bg-gray-50 rounded-xl p-6 border">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-400">Analyzed by</span>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
              {report.llmUsed}
            </span>
          </div>
          <pre className="text-sm overflow-auto whitespace-pre-wrap">
            {JSON.stringify(report.resultJson, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
```

### Step 4.8 — App.jsx Routes
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import Layout from './components/layout/Layout'
import GeotechnicalPage from './pages/modules/GeotechnicalPage'
import BOQPage from './pages/modules/BOQPage'
import ISCodePage from './pages/modules/ISCodePage'
import StructuralPage from './pages/modules/StructuralPage'
import TenderPage from './pages/modules/TenderPage'
import SiteInspectionPage from './pages/modules/SiteInspectionPage'

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="geotech" element={<GeotechnicalPage />} />
          <Route path="boq" element={<BOQPage />} />
          <Route path="iscode" element={<ISCodePage />} />
          <Route path="structural" element={<StructuralPage />} />
          <Route path="tender" element={<TenderPage />} />
          <Route path="site-inspection" element={<SiteInspectionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

### Step 4.9 — Start Frontend
```bash
cd frontend
npm run dev
# Opens at http://localhost:5173
```

---

## Phase 5 — Integration Testing

### Full Flow Test Checklist
```
□ Register user → POST /api/auth/register
□ Login → POST /api/auth/login → get token
□ Create project → POST /api/projects
□ Upload PDF → POST /api/documents/upload → get documentId
□ Trigger geotech analysis → POST /api/analyze/geotech
□ Poll report → GET /api/reports/{reportId} until status=SUCCESS
□ View result_json in frontend
□ Test IS code query (no file) → POST /api/analyze/iscode/query
□ Test structural form → POST /api/analyze/structural
□ Test fallback: disable Groq key → should fall back to Gemini
```

---

## Phase 6 — Optional: Docker Compose for Local Dev

Create `docker-compose.yml` in project root:
```yaml
version: '3.8'
services:

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

  ai-service:
    build: ./ai-service
    ports:
      - "8000:8000"
    env_file: ./ai-service/.env
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    env_file: ./backend/.env
    depends_on:
      - minio
      - ai-service

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  minio_data:
```

Run everything:
```bash
docker-compose up --build
```

---

## Phase 7 — Deploy (When Ready)

### Frontend → Vercel
```bash
cd frontend
npm run build
# Push to GitHub → connect repo to vercel.com → auto-deploys
# Set env var: VITE_API_BASE_URL=https://your-backend.onrender.com
```

### Backend → Render.com
```
1. Push backend/ to GitHub
2. Render.com → New Web Service → Connect repo
3. Build: mvn clean package -DskipTests
4. Start: java -jar target/backend-0.0.1-SNAPSHOT.jar
5. Add environment variables (DB_HOST, JWT_SECRET, etc.)
```

### FastAPI AI Service → Render.com
```
1. Push ai-service/ to GitHub
2. Render.com → New Web Service → Connect repo
3. Build: pip install -r requirements.txt
4. Start: uvicorn main:app --host 0.0.0.0 --port $PORT
5. Add GROQ_API_KEY, GEMINI_API_KEY, HUGGINGFACE_API_KEY
```

### MinIO → Railway.app (Free $5 credit)
```
1. railway.app → New Project → Deploy MinIO template
2. Get endpoint URL → update MINIO_ENDPOINT in backend env
```

---

## Build Order Summary

```
Week 1 — Foundation
  Day 1: Neon DB setup + run schema ✓
  Day 2: MinIO Docker setup ✓
  Day 3: Spring Boot project + config + Flyway ✓
  Day 4: Auth (JWT register/login) ✓
  Day 5: User + Project endpoints ✓

Week 2 — Core Backend
  Day 1: MinioService + DocumentController (file upload) ✓
  Day 2: AiGatewayService (WebClient → FastAPI) ✓
  Day 3: AnalysisService + AnalysisController ✓
  Day 4: ReportController (get report, list by project) ✓
  Day 5: Test all endpoints via Swagger UI ✓

Week 3 — Frontend
  Day 1: Vite setup + Tailwind + Router + Zustand ✓
  Day 2: Login + Register pages ✓
  Day 3: Dashboard + Project pages ✓
  Day 4: FileUpload component + 3 module pages ✓
  Day 5: Remaining 3 module pages + ReportViewer ✓

Week 4 — Integration & Polish
  Day 1-2: End-to-end testing all modules ✓
  Day 3: Error handling + loading states ✓
  Day 4: Docker Compose setup ✓
  Day 5: Deploy to Vercel + Render ✓
```

---

## Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| Spring can't connect to Neon | Add `?sslmode=require` to JDBC URL |
| MinIO connection refused | Make sure Docker container is running |
| CORS error from React | Add `@CrossOrigin` or configure in SecurityConfig |
| Flyway migration fails | Check SQL syntax, ensure schema doesn't already exist |
| FastAPI returns 422 | Request body format mismatch — check field names |
| JWT token invalid | Ensure secret is same in `.env` and used consistently |
| File upload fails | Check MinIO bucket exists + correct credentials |
| LLM timeout | Increase `timeout(Duration.ofSeconds(90))` in WebClient |
| FAISS numpy error | `pip install "numpy<2.0"` in AI service |
