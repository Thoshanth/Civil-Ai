# 🗺️ CivilAI Deployment Roadmap

Visual guide to deploying CivilAI platform for free.

## 🎯 Overview

```
START → Get Accounts → Setup Infrastructure → Deploy Services → Test → LIVE! 🎉
  5min      10min            15min               30min         10min    
```

**Total Time: ~70 minutes**
**Total Cost: $0/month**

---

## 📍 Phase 1: Get Accounts (10 minutes)

### Step 1.1: Database Account
```
┌─────────────────────────────────┐
│      https://neon.tech          │
│                                 │
│  Sign up with GitHub            │
│  ✓ Free PostgreSQL database     │
│  ✓ 0.5 GB storage               │
│  ✓ Auto-suspend feature         │
└─────────────────────────────────┘
```
**Time**: 2 minutes

### Step 1.2: Storage Account
```
┌─────────────────────────────────┐
│    https://cloudflare.com       │
│                                 │
│  Sign up with email             │
│  ✓ Free R2 object storage       │
│  ✓ 10 GB storage                │
│  ✓ S3-compatible API            │
└─────────────────────────────────┘
```
**Time**: 2 minutes

### Step 1.3: Hosting Accounts
```
┌─────────────────────────────────┐
│     https://render.com          │
│                                 │
│  Sign up with GitHub            │
│  ✓ Backend hosting              │
│  ✓ AI Gateway hosting           │
│  ✓ 750 hours/month each         │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│     https://vercel.com          │
│                                 │
│  Sign up with GitHub            │
│  ✓ Frontend hosting             │
│  ✓ Unlimited deployments        │
│  ✓ 100 GB bandwidth             │
└─────────────────────────────────┘
```
**Time**: 3 minutes

### Step 1.4: API Keys
```
┌─────────────────────────────────┐
│   https://console.groq.com      │
│   Primary LLM (LLaMA 3.3 70B)   │
│   14,400 requests/day           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ https://aistudio.google.com     │
│ Fallback LLM + Vision (Gemini)  │
│ 1,500 requests/day              │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   https://huggingface.co        │
│   Optional Fallback (Mistral)   │
│   Rate limited                  │
└─────────────────────────────────┘
```
**Time**: 3 minutes

✅ **Phase 1 Complete!**

---

## 📍 Phase 2: Setup Infrastructure (15 minutes)

### Step 2.1: Create Database
```
Neon Dashboard
    │
    ├─→ Create Project
    │   └─→ Name: "civilai"
    │
    ├─→ Copy Connection String
    │   └─→ postgresql://user:pass@host/db?sslmode=require
    │
    └─→ Extract Credentials
        ├─→ DB_HOST
        ├─→ DB_USERNAME
        ├─→ DB_PASSWORD
        └─→ DB_NAME
```
**Time**: 5 minutes

### Step 2.2: Create Storage Bucket
```
Cloudflare Dashboard
    │
    ├─→ Go to R2
    │
    ├─→ Create Bucket
    │   └─→ Name: "civilai-files"
    │
    ├─→ Manage R2 API Tokens
    │
    └─→ Create API Token
        ├─→ Access Key ID
        ├─→ Secret Access Key
        └─→ Endpoint URL
```
**Time**: 5 minutes

### Step 2.3: Prepare Environment Variables
```
Copy .env.template
    │
    ├─→ backend/.env.deploy
    ├─→ ai-gateway/.env.deploy
    └─→ frontend/.env.deploy
    
Fill in all credentials:
    ├─→ Database credentials
    ├─→ Storage credentials
    ├─→ API keys
    └─→ JWT secret (generate random)
```
**Time**: 5 minutes

✅ **Phase 2 Complete!**

---

## 📍 Phase 3: Deploy Services (30 minutes)

### Step 3.1: Deploy AI Gateway (10 minutes)
```
Render Dashboard
    │
    ├─→ New Web Service
    │
    ├─→ Connect GitHub Repo
    │
    ├─→ Configure
    │   ├─→ Name: civilai-gateway
    │   ├─→ Root: ai-gateway
    │   ├─→ Runtime: Python 3
    │   ├─→ Build: pip install -r requirements.txt
    │   ├─→ Start: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    │   └─→ Plan: Free
    │
    ├─→ Add Environment Variables
    │   ├─→ GROQ_API_KEY
    │   ├─→ GEMINI_API_KEY
    │   ├─→ HF_TOKEN
    │   └─→ PYTHON_VERSION=3.11
    │
    ├─→ Create Web Service
    │
    └─→ Wait for Build (5-7 min)
        └─→ Copy URL: https://civilai-gateway.onrender.com
```

**Status Check**:
```bash
curl https://civilai-gateway.onrender.com/health
# Expected: {"status":"healthy"}
```

### Step 3.2: Deploy Backend (15 minutes)
```
Render Dashboard
    │
    ├─→ New Web Service
    │
    ├─→ Connect GitHub Repo
    │
    ├─→ Configure
    │   ├─→ Name: civilai-backend
    │   ├─→ Root: backend
    │   ├─→ Runtime: Java
    │   ├─→ Build: mvn clean package -DskipTests
    │   ├─→ Start: java -jar target/backend-0.0.1-SNAPSHOT.jar
    │   └─→ Plan: Free
    │
    ├─→ Add Environment Variables
    │   ├─→ DB_HOST, DB_USERNAME, DB_PASSWORD
    │   ├─→ MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY
    │   ├─→ AI_SERVICE_URL (from Step 3.1)
    │   └─→ JWT_SECRET
    │
    ├─→ Create Web Service
    │
    └─→ Wait for Build (10-12 min)
        └─→ Copy URL: https://civilai-backend.onrender.com
```

**Status Check**:
```bash
curl https://civilai-backend.onrender.com/actuator/health
# Expected: {"status":"UP"}
```

### Step 3.3: Deploy Frontend (5 minutes)
```
Vercel Dashboard
    │
    ├─→ Add New Project
    │
    ├─→ Import GitHub Repo
    │
    ├─→ Configure
    │   ├─→ Framework: Vite
    │   ├─→ Root: frontend
    │   ├─→ Build: npm run build
    │   └─→ Output: dist
    │
    ├─→ Add Environment Variable
    │   └─→ VITE_API_BASE_URL (from Step 3.2)
    │
    ├─→ Deploy
    │
    └─→ Wait for Build (2-3 min)
        └─→ Copy URL: https://civilai.vercel.app
```

**Status Check**:
```bash
curl https://civilai.vercel.app
# Expected: HTTP 200
```

✅ **Phase 3 Complete!**

---

## 📍 Phase 4: Configure & Test (10 minutes)

### Step 4.1: Update CORS (2 minutes)
```
Edit: backend/src/main/java/com/civilai/config/SecurityConfig.java

Add your Vercel URL:
    configuration.setAllowedOrigins(Arrays.asList(
        "http://localhost:5173",
        "https://civilai.vercel.app",  ← Add this
        "https://*.vercel.app"         ← Add this
    ));

Commit & Push → Render auto-redeploys
```

### Step 4.2: Test Registration (2 minutes)
```bash
curl -X POST https://civilai-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "fullName": "Test User"
  }'

# Expected: {"token":"eyJ...","user":{...}}
```

### Step 4.3: Test Login (2 minutes)
```bash
curl -X POST https://civilai-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Expected: {"token":"eyJ...","user":{...}}
```

### Step 4.4: Test Frontend (2 minutes)
```
Open: https://civilai.vercel.app

1. Click "Register"
2. Create account
3. Login
4. Create project
5. Upload document
6. Run analysis

✓ All working!
```

### Step 4.5: Run Status Checker (2 minutes)
```bash
# Linux/Mac
./check-deployment.sh

# Windows
check-deployment.bat

# Expected: All services ✓ OK
```

✅ **Phase 4 Complete!**

---

## 🎉 DEPLOYMENT COMPLETE!

```
┌─────────────────────────────────────────────┐
│                                             │
│     🎊 CivilAI is now LIVE! 🎊             │
│                                             │
│  Frontend:   https://civilai.vercel.app     │
│  Backend:    https://civilai-backend...     │
│  AI Gateway: https://civilai-gateway...     │
│                                             │
│  Total Time: ~70 minutes                    │
│  Total Cost: $0/month                       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        │                │                │
┌───────▼────────┐ ┌─────▼──────┐ ┌──────▼────────┐
│   Vercel       │ │  Render    │ │   Render      │
│   (Frontend)   │ │  (Backend) │ │ (AI Gateway)  │
│                │ │            │ │               │
│   React App    │ │  Spring    │ │   FastAPI     │
│   Vite Build   │ │  Boot API  │ │   LLM Chain   │
│                │ │            │ │               │
│   Always On    │ │  Sleeps    │ │   Sleeps      │
│   Instant      │ │  15min     │ │   15min       │
└────────────────┘ └─────┬──────┘ └───────────────┘
                         │
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼────────┐ ┌─────▼──────┐ ┌──────▼────────┐
│   Neon.tech    │ │ Cloudflare │ │  LLM APIs     │
│  (PostgreSQL)  │ │    (R2)    │ │               │
│                │ │            │ │  Groq         │
│  0.5 GB Free   │ │ 10 GB Free │ │  Gemini       │
│  Auto-suspend  │ │ S3 API     │ │  HuggingFace  │
└────────────────┘ └────────────┘ └───────────────┘
```

---

## 🔄 Continuous Deployment

```
Developer Workflow:
    │
    ├─→ Make changes locally
    │
    ├─→ Commit to Git
    │
    ├─→ Push to GitHub
    │
    └─→ Auto-deploy
        ├─→ Render watches 'main' branch
        ├─→ Vercel watches 'main' branch
        └─→ Both rebuild automatically
```

**GitHub Actions** (optional):
- Runs tests on push
- Validates build
- Reports status

---

## 📈 Monitoring Dashboard

### Render.com
```
Dashboard → Services
    │
    ├─→ civilai-backend
    │   ├─→ Status: Running
    │   ├─→ Logs: Real-time
    │   ├─→ Metrics: CPU, Memory
    │   └─→ Events: Deploys, Restarts
    │
    └─→ civilai-gateway
        ├─→ Status: Running
        ├─→ Logs: Real-time
        ├─→ Metrics: CPU, Memory
        └─→ Events: Deploys, Restarts
```

### Vercel
```
Dashboard → Projects → civilai-frontend
    │
    ├─→ Deployments: History
    ├─→ Analytics: Traffic
    ├─→ Logs: Build & Runtime
    └─→ Domains: Custom domains
```

### Neon.tech
```
Dashboard → Projects → civilai
    │
    ├─→ Monitoring: Queries
    ├─→ Branches: Database branches
    ├─→ Settings: Connection pooling
    └─→ Usage: Storage & compute
```

---

## 🎯 Success Metrics

```
✅ All services deployed
✅ All health checks passing
✅ User registration working
✅ User login working
✅ File upload working
✅ Analysis working
✅ Results displaying

🎊 READY FOR USERS! 🎊
```

---

## 🚀 Next Steps

1. **Share with users**
   - Send Vercel URL
   - Provide user guide
   - Collect feedback

2. **Monitor usage**
   - Check logs daily
   - Monitor API limits
   - Track errors

3. **Optimize**
   - Add cron job to prevent sleep
   - Optimize cold start times
   - Cache frequently used data

4. **Scale when needed**
   - Upgrade to paid tiers
   - Add custom domains
   - Increase resources

---

## 📞 Need Help?

- **Quick Deploy**: See QUICK_DEPLOY.md
- **Full Guide**: See DEPLOYMENT.md
- **Summary**: See DEPLOYMENT_SUMMARY.md
- **Interactive**: Run `./deploy.sh`

---

**🎉 Happy Deploying! 🚀**

Built with ❤️ for civil engineers
