# 🚀 Free Deployment Guide for CivilAI

Complete guide to deploy CivilAI platform using **100% free services**.

## 📋 Overview

| Component | Service | Free Tier | Status |
|-----------|---------|-----------|--------|
| Frontend | Vercel | Unlimited | ✅ Ready |
| Backend | Render.com | 750 hrs/month | ✅ Ready |
| AI Gateway | Render.com | 750 hrs/month | ✅ Ready |
| Database | Neon.tech | 0.5 GB storage | ✅ Ready |
| File Storage | Cloudflare R2 | 10 GB/month | ✅ Ready |

**Total Cost: $0/month** 🎉

---

## 🎯 Deployment Order

1. Database (Neon.tech) - 5 minutes
2. File Storage (Cloudflare R2) - 10 minutes
3. AI Gateway (Render.com) - 15 minutes
4. Backend (Render.com) - 15 minutes
5. Frontend (Vercel) - 10 minutes

**Total Time: ~55 minutes**

---

## 1️⃣ Database Setup (Neon.tech)

### Step 1: Create Account
1. Go to https://neon.tech
2. Sign up with GitHub (free)
3. Click "Create Project"

### Step 2: Configure Database
- **Project Name**: `civilai`
- **Region**: Choose closest to you
- **PostgreSQL Version**: 16 (latest)
- Click "Create Project"

### Step 3: Get Connection String
1. Click "Connection Details"
2. Copy the connection string (looks like):
   ```
   postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require
   ```
3. Save this - you'll need it for backend deployment

### Step 4: Extract Credentials
From the connection string, extract:
- **DB_HOST**: `ep-xxx.neon.tech:5432`
- **DB_USERNAME**: `username`
- **DB_PASSWORD**: `password`
- **DB_NAME**: `neondb`

✅ **Database Ready!**

---

## 2️⃣ File Storage Setup (Cloudflare R2)

### Step 1: Create Cloudflare Account
1. Go to https://cloudflare.com
2. Sign up (free)
3. Go to Dashboard → R2

### Step 2: Create R2 Bucket
1. Click "Create bucket"
2. **Bucket Name**: `civilai-files`
3. **Location**: Automatic
4. Click "Create bucket"

### Step 3: Generate API Credentials
1. Go to R2 → "Manage R2 API Tokens"
2. Click "Create API Token"
3. **Token Name**: `civilai-backend`
4. **Permissions**: Object Read & Write
5. **Bucket**: `civilai-files`
6. Click "Create API Token"

### Step 4: Save Credentials
Copy and save:
- **Access Key ID**: `xxx`
- **Secret Access Key**: `xxx`
- **Endpoint URL**: `https://xxx.r2.cloudflarestorage.com`

✅ **Storage Ready!**

---

## 3️⃣ AI Gateway Deployment (Render.com)

### Step 1: Get API Keys

#### Groq API Key (Primary LLM)
1. Go to https://console.groq.com
2. Sign up with Google
3. Go to "API Keys" → "Create API Key"
4. Copy key: `gsk_xxx`

#### Google Gemini API Key (Fallback + Vision)
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy key: `AIzaSyxxx`

#### HuggingFace Token (Optional Fallback)
1. Go to https://huggingface.co/settings/tokens
2. Sign up/login
3. Create "Read" token
4. Copy token: `hf_xxx`

### Step 2: Deploy to Render

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Select `ai-gateway` folder

### Step 3: Configure Service

**Basic Settings:**
- **Name**: `civilai-gateway`
- **Region**: Choose closest
- **Branch**: `main`
- **Root Directory**: `ai-gateway`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Instance Type:**
- Select **Free** (512 MB RAM, shared CPU)

### Step 4: Add Environment Variables

Click "Advanced" → "Add Environment Variable":

```bash
GROQ_API_KEY=gsk_xxx
GEMINI_API_KEY=AIzaSyxxx
HF_TOKEN=hf_xxx
PYTHON_VERSION=3.11
```

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for build
3. Copy the URL: `https://civilai-gateway.onrender.com`

### Step 6: Test
```bash
curl https://civilai-gateway.onrender.com/health
# Should return: {"status":"healthy"}
```

✅ **AI Gateway Live!**

---

## 4️⃣ Backend Deployment (Render.com)

### Step 1: Create Web Service
1. In Render dashboard, click "New +" → "Web Service"
2. Connect GitHub repository
3. Select `backend` folder

### Step 2: Configure Service

**Basic Settings:**
- **Name**: `civilai-backend`
- **Region**: Same as AI Gateway
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Java`
- **Build Command**: `mvn clean package -DskipTests`
- **Start Command**: `java -jar target/backend-0.0.1-SNAPSHOT.jar`

**Instance Type:**
- Select **Free** (512 MB RAM)

### Step 3: Add Environment Variables

Use credentials from previous steps:

```bash
# Database (from Neon.tech)
DB_HOST=ep-xxx.neon.tech:5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=neondb
DB_SSL_MODE=require

# File Storage (from Cloudflare R2)
MINIO_ENDPOINT=https://xxx.r2.cloudflarestorage.com
MINIO_ACCESS_KEY=your_r2_access_key
MINIO_SECRET_KEY=your_r2_secret_key
MINIO_BUCKET=civilai-files

# AI Service (from previous step)
AI_SERVICE_URL=https://civilai-gateway.onrender.com

# JWT Secret (generate random 32+ char string)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long_change_this

# Email (optional - for OTP)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
```

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait 10-15 minutes for Maven build
3. Copy URL: `https://civilai-backend.onrender.com`

### Step 5: Test
```bash
curl https://civilai-backend.onrender.com/actuator/health
# Should return: {"status":"UP"}
```

✅ **Backend Live!**

---

## 5️⃣ Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### Step 2: Deploy via Vercel Dashboard

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Select `frontend` folder

### Step 3: Configure Build

**Framework Preset:** Vite
**Root Directory:** `frontend`
**Build Command:** `npm run build`
**Output Directory:** `dist`

### Step 4: Add Environment Variables

```bash
VITE_API_BASE_URL=https://civilai-backend.onrender.com/api
```

### Step 5: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. Copy URL: `https://civilai.vercel.app`

### Step 6: Test
Open `https://civilai.vercel.app` in browser

✅ **Frontend Live!**

---

## 🔧 Post-Deployment Configuration

### 1. Update CORS in Backend

The backend needs to allow requests from your Vercel domain.

Edit `backend/src/main/java/com/civilai/config/SecurityConfig.java`:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList(
        "http://localhost:5173",
        "https://civilai.vercel.app",  // Add your Vercel URL
        "https://*.vercel.app"          // Allow preview deployments
    ));
    // ... rest of config
}
```

Commit and push - Render will auto-redeploy.

### 2. Configure Custom Domain (Optional)

#### Vercel (Frontend)
1. Go to Project Settings → Domains
2. Add your domain: `app.yourdomain.com`
3. Update DNS records as instructed

#### Render (Backend)
1. Go to Service Settings → Custom Domain
2. Add: `api.yourdomain.com`
3. Update DNS records

### 3. Enable HTTPS (Automatic)
All services provide free SSL certificates automatically.

---

## 📊 Service Limits & Monitoring

### Render.com Free Tier
- **750 hours/month** per service
- Services sleep after 15 min inactivity
- **Cold start**: 30-60 seconds
- **Workaround**: Use cron job to ping every 14 minutes

### Keep Services Awake (Optional)

Create a free cron job at https://cron-job.org:

```bash
# Ping every 14 minutes
https://civilai-backend.onrender.com/actuator/health
https://civilai-gateway.onrender.com/health
```

### Neon.tech Free Tier
- **0.5 GB storage**
- **1 project**
- Auto-suspend after 5 min inactivity
- **Workaround**: Connection pooling (already configured)

### Cloudflare R2 Free Tier
- **10 GB storage**
- **1 million Class A operations/month**
- **10 million Class B operations/month**

### Vercel Free Tier
- **100 GB bandwidth/month**
- **Unlimited** deployments
- **Automatic** preview deployments

---

## 🧪 Testing Deployment

### 1. Test Registration
```bash
curl -X POST https://civilai-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "fullName": "Test User"
  }'
```

### 2. Test Login
```bash
curl -X POST https://civilai-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### 3. Test AI Gateway
```bash
curl -X POST https://civilai-gateway.onrender.com/api/structural/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "building_type": "residential",
    "floor_area_m2": 400,
    "floors": 4,
    "zone": "IV",
    "soil_type": "II"
  }'
```

### 4. Test Frontend
1. Open `https://civilai.vercel.app`
2. Click "Register"
3. Create account
4. Login
5. Create project
6. Upload document
7. Run analysis

---

## 🐛 Troubleshooting

### Backend Won't Start
**Error**: Database connection failed
**Fix**: Check DB credentials, ensure `?sslmode=require` in connection string

### AI Gateway Timeout
**Error**: 504 Gateway Timeout
**Fix**: Increase timeout in backend `application.yml`:
```yaml
ai:
  service:
    timeout-seconds: 120
```

### Frontend API Errors
**Error**: CORS blocked
**Fix**: Add Vercel URL to backend CORS config

### File Upload Fails
**Error**: MinIO connection refused
**Fix**: Check R2 credentials, ensure endpoint URL is correct

### Cold Start Delays
**Issue**: First request takes 30-60 seconds
**Fix**: Use cron job to keep services warm (see above)

---

## 💰 Cost Breakdown

| Service | Free Tier | Paid Tier (if needed) |
|---------|-----------|----------------------|
| Vercel | 100 GB bandwidth | $20/month (Pro) |
| Render.com | 750 hrs/month | $7/month per service |
| Neon.tech | 0.5 GB storage | $19/month (Scale) |
| Cloudflare R2 | 10 GB storage | $0.015/GB after |
| Groq API | 14,400 req/day | Free (for now) |
| Gemini API | 1,500 req/day | Pay-as-you-go |

**Current Setup: $0/month**
**If you exceed limits: ~$50/month**

---

## 🚀 Scaling Strategy

### When to Upgrade

1. **Backend/Gateway** (Render $7/month each)
   - No cold starts
   - Always-on
   - Better performance

2. **Database** (Neon $19/month)
   - More storage
   - Better performance
   - No auto-suspend

3. **Storage** (R2 pay-as-you-go)
   - Only pay for what you use
   - Very cheap ($0.015/GB)

### Alternative Free Options

- **Backend**: Railway.com (500 hrs/month)
- **Database**: Supabase (500 MB free)
- **Storage**: Backblaze B2 (10 GB free)
- **Frontend**: Netlify (100 GB bandwidth)

---

## 📝 Deployment Checklist

- [ ] Neon.tech database created
- [ ] Cloudflare R2 bucket created
- [ ] Groq API key obtained
- [ ] Gemini API key obtained
- [ ] AI Gateway deployed to Render
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] CORS configured
- [ ] Environment variables set
- [ ] Health checks passing
- [ ] Registration tested
- [ ] Login tested
- [ ] File upload tested
- [ ] Analysis tested
- [ ] Cron job configured (optional)

---

## 🎉 Success!

Your CivilAI platform is now live and accessible at:

- **Frontend**: https://civilai.vercel.app
- **Backend API**: https://civilai-backend.onrender.com
- **AI Gateway**: https://civilai-gateway.onrender.com
- **API Docs**: https://civilai-backend.onrender.com/swagger-ui

Share your app with users and start analyzing civil engineering documents! 🏗️

---

## 📞 Support

- **Issues**: Open GitHub issue
- **Docs**: Check `/docs` folder
- **Email**: support@civilai.com

**Built with ❤️ for civil engineers**
