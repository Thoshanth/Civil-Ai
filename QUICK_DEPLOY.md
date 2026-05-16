# ⚡ Quick Deploy Guide (15 Minutes)

Deploy CivilAI to production in 15 minutes using free services.

## 🎯 Prerequisites

- GitHub account
- Email address for signups

## 🚀 Step-by-Step

### 1. Database (2 minutes)

1. Go to https://neon.tech → Sign up with GitHub
2. Create project: `civilai`
3. Copy connection string → Save for later

### 2. Storage (3 minutes)

1. Go to https://cloudflare.com → Sign up
2. Dashboard → R2 → Create bucket: `civilai-files`
3. Manage R2 API Tokens → Create token
4. Copy Access Key, Secret Key, Endpoint → Save for later

### 3. API Keys (3 minutes)

Get these API keys (all free):

- **Groq**: https://console.groq.com → API Keys → Create
- **Gemini**: https://aistudio.google.com/app/apikey → Create
- **HuggingFace**: https://huggingface.co/settings/tokens → New token

### 4. Deploy AI Gateway (3 minutes)

1. Go to https://render.com → Sign up with GitHub
2. New + → Web Service → Connect your repo
3. Configure:
   - **Name**: `civilai-gateway`
   - **Root Directory**: `ai-gateway`
   - **Runtime**: Python 3
   - **Build**: `pip install -r requirements.txt`
   - **Start**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

4. Environment Variables:
   ```
   GROQ_API_KEY=gsk_xxx
   GEMINI_API_KEY=AIzaSyxxx
   HF_TOKEN=hf_xxx
   PYTHON_VERSION=3.11
   ```

5. Create Web Service → Wait 5 min → Copy URL

### 5. Deploy Backend (3 minutes)

1. Render → New + → Web Service → Same repo
2. Configure:
   - **Name**: `civilai-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Java
   - **Build**: `mvn clean package -DskipTests`
   - **Start**: `java -jar target/backend-0.0.1-SNAPSHOT.jar`
   - **Plan**: Free

3. Environment Variables (use your saved values):
   ```
   DB_HOST=ep-xxx.neon.tech:5432
   DB_USERNAME=xxx
   DB_PASSWORD=xxx
   DB_NAME=neondb
   DB_SSL_MODE=require
   
   MINIO_ENDPOINT=https://xxx.r2.cloudflarestorage.com
   MINIO_ACCESS_KEY=xxx
   MINIO_SECRET_KEY=xxx
   MINIO_BUCKET=civilai-files
   
   AI_SERVICE_URL=https://civilai-gateway.onrender.com
   
   JWT_SECRET=your_random_32_character_secret_key_here
   ```

4. Create Web Service → Wait 10 min → Copy URL

### 6. Deploy Frontend (1 minute)

1. Go to https://vercel.com → Sign up with GitHub
2. Add New → Project → Import your repo
3. Configure:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build**: `npm run build`
   - **Output**: `dist`

4. Environment Variable:
   ```
   VITE_API_BASE_URL=https://civilai-backend.onrender.com/api
   ```

5. Deploy → Wait 2 min → Copy URL

## ✅ Done!

Your app is live at:
- **Frontend**: https://civilai.vercel.app
- **Backend**: https://civilai-backend.onrender.com
- **AI Gateway**: https://civilai-gateway.onrender.com

## 🧪 Test It

1. Open your Vercel URL
2. Click "Register"
3. Create account
4. Login
5. Create a project
6. Upload a document
7. Run analysis

## ⚠️ Important Notes

### Cold Starts
Free tier services sleep after 15 min inactivity. First request takes 30-60 seconds.

**Solution**: Use https://cron-job.org to ping every 14 minutes:
- `https://civilai-backend.onrender.com/actuator/health`
- `https://civilai-gateway.onrender.com/health`

### CORS Configuration
If you get CORS errors, update backend CORS config:

Edit `backend/src/main/java/com/civilai/config/SecurityConfig.java`:

```java
configuration.setAllowedOrigins(Arrays.asList(
    "http://localhost:5173",
    "https://civilai.vercel.app",  // Your Vercel URL
    "https://*.vercel.app"
));
```

Commit and push → Render auto-redeploys.

### Custom Domain (Optional)

**Frontend (Vercel)**:
1. Project Settings → Domains → Add domain
2. Update DNS as instructed

**Backend (Render)**:
1. Service Settings → Custom Domain → Add domain
2. Update DNS as instructed

## 📊 Free Tier Limits

| Service | Limit | Upgrade Cost |
|---------|-------|--------------|
| Render | 750 hrs/month | $7/month |
| Vercel | 100 GB bandwidth | $20/month |
| Neon | 0.5 GB storage | $19/month |
| R2 | 10 GB storage | Pay-as-you-go |
| Groq | 14,400 req/day | Free |
| Gemini | 1,500 req/day | Pay-as-you-go |

**Current setup: $0/month**

## 🐛 Troubleshooting

### Backend won't start
- Check DB credentials
- Ensure `?sslmode=require` in connection string

### AI Gateway timeout
- Increase timeout in backend `application.yml`
- Check API keys are correct

### Frontend can't connect
- Check `VITE_API_BASE_URL` is correct
- Update CORS in backend

### File upload fails
- Check R2 credentials
- Ensure bucket name is correct

## 📚 Full Documentation

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete guide.

## 🎉 Success!

You now have a fully deployed AI-powered civil engineering platform!

Share it with your team and start analyzing documents. 🏗️

---

**Need help?** Open an issue on GitHub or check the docs.
