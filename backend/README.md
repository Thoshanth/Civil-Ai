# CivilAI Backend

Spring Boot backend for the CivilAI platform.

## Prerequisites

- Java 21
- Maven 3.8+
- PostgreSQL database (Neon.tech recommended)
- MinIO (Docker or cloud)
- Running AI Gateway service (FastAPI)

## Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Database
DB_HOST=your-neon-host.neon.tech:5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_SSL_MODE=require

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=civilai-files

# AI Service
AI_SERVICE_URL=http://localhost:8000

# JWT
JWT_SECRET=your_secret_key_minimum_32_characters_long

# Email (optional)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

## Quick Start

### 1. Start MinIO (Docker)

```bash
docker run -d \
  --name civilai-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  minio/minio server /data --console-address ":9001"
```

Then create bucket:
1. Open http://localhost:9001
2. Login with minioadmin/minioadmin123
3. Create bucket named `civilai-files`

### 2. Build and Run

```bash
# Build
mvn clean package -DskipTests

# Run
mvn spring-boot:run
```

The server will start on http://localhost:8080

### 3. Test

```bash
# Health check
curl http://localhost:8080/actuator/health

# Swagger UI
open http://localhost:8080/swagger-ui
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with OTP

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Documents
- `POST /api/documents/upload` - Upload file
- `GET /api/documents/project/{projectId}` - List project documents
- `GET /api/documents/{id}` - Get document details
- `GET /api/documents/{id}/download-url` - Get presigned download URL
- `DELETE /api/documents/{id}` - Delete document

### Analysis
- `POST /api/analyze/{module}` - Analyze uploaded document
- `POST /api/analyze/{module}/json` - Analyze with JSON data

Modules: `geotech`, `boq`, `iscode`, `structural`, `tender`, `site-photo`

### Reports
- `GET /api/reports/{id}` - Get report by ID
- `GET /api/reports/document/{documentId}` - List document reports
- `GET /api/reports/module/{module}` - List module reports
- `GET /api/reports/{id}/audit` - Get LLM fallback audit trail

### Users
- `GET /api/users/me` - Get current user profile

## Architecture

```
┌─────────────────────────────────────────┐
│         Spring Boot Backend             │
├─────────────────────────────────────────┤
│  Controllers (REST API)                 │
│  ├─ AuthController                      │
│  ├─ ProjectController                   │
│  ├─ DocumentController                  │
│  ├─ AnalysisController                  │
│  └─ ReportController                    │
├─────────────────────────────────────────┤
│  Services (Business Logic)              │
│  ├─ AuthService                         │
│  ├─ ProjectService                      │
│  ├─ DocumentService                     │
│  ├─ AnalysisService (Async)             │
│  ├─ MinioService                        │
│  └─ AiGatewayService (WebClient)        │
├─────────────────────────────────────────┤
│  Repositories (Data Access)             │
│  ├─ UserRepository                      │
│  ├─ ProjectRepository                   │
│  ├─ DocumentRepository                  │
│  ├─ ReportRepository                    │
│  └─ LlmAuditRepository                  │
├─────────────────────────────────────────┤
│  External Services                      │
│  ├─ PostgreSQL (Neon)                   │
│  ├─ MinIO (File Storage)                │
│  └─ FastAPI (AI Gateway)                │
└─────────────────────────────────────────┘
```

## Database Schema

Managed by Flyway migrations in `src/main/resources/db/migration/`

Tables:
- `users` - User accounts
- `projects` - Project grouping
- `documents` - File metadata
- `reports` - Analysis results
- `llm_audit` - LLM fallback tracking
- `otp_store` - Email verification codes

## Development

### Run Tests
```bash
mvn test
```

### Format Code
```bash
mvn spotless:apply
```

### Generate OpenAPI Spec
```bash
curl http://localhost:8080/api-docs > openapi.json
```

## Deployment

### Build JAR
```bash
mvn clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Docker
```bash
docker build -t civilai-backend .
docker run -p 8080:8080 --env-file .env civilai-backend
```

### Deploy to Render.com
1. Push to GitHub
2. Connect repo to Render
3. Build command: `mvn clean package -DskipTests`
4. Start command: `java -jar target/backend-0.0.1-SNAPSHOT.jar`
5. Add environment variables

## Troubleshooting

### Database Connection Failed
- Ensure `?sslmode=require` is in JDBC URL for Neon
- Check DB credentials

### MinIO Connection Refused
- Ensure Docker container is running: `docker ps`
- Check endpoint URL

### AI Service Timeout
- Increase `ai.service.timeout-seconds` in application.yml
- Check if FastAPI service is running

### Flyway Migration Failed
- Check SQL syntax in migration files
- Ensure database is empty or use `spring.flyway.baseline-on-migrate=true`

## License

MIT
