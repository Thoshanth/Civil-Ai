# CivilAI - Quick Start Guide

## Current Status

✅ **AI Gateway (FastAPI)** - Complete and working
✅ **Backend (Java Spring Boot)** - Just completed
🔜 **Frontend (React)** - Next step

## Local Development Setup

### 1. Start MinIO (File Storage)

```bash
docker run -d --name civilai-minio -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin123 \
  minio/minio server /data --console-address ":9001"
```

Create bucket at http://localhost:9001 (login: minioadmin/minioadmin123)
- Bucket name: `civilai-files`

### 2. Setup Database

Sign up at https://neon.tech (free)
- Create project: `civilai`
- Copy connection string

### 3. Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Start Services

Terminal 1 - AI Gateway:
```bash
cd ai-gateway
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Terminal 2 - Backend:
```bash
cd backend
mvn spring-boot:run
```

### 5. Test

- AI Gateway: http://localhost:8000/health
- Backend: http://localhost:8080/actuator/health
- Swagger: http://localhost:8080/swagger-ui

## Next Steps

1. Test the API endpoints via Swagger UI
2. Build the React frontend
3. Deploy to production

## Troubleshooting

**Database connection failed?**
- Add `?sslmode=require` to Neon connection string

**MinIO not working?**
- Check Docker: `docker ps`
- Restart: `docker restart civilai-minio`

**AI Gateway timeout?**
- Check if FastAPI is running on port 8000
- Verify API keys in ai-gateway/.env
