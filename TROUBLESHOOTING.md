# CivilAI Troubleshooting Guide

## Registration Issues

### Problem: "Registration failed. Please try again."

#### Possible Causes & Solutions:

1. **Email Service Not Configured**
   - **Check:** Backend logs for email errors
   - **Fix:** Verify `MAIL_USERNAME` and `MAIL_PASSWORD` in `backend/.env`
   - **Note:** Gmail app password should have NO spaces (remove spaces if present)
   
   ```env
   # ❌ Wrong
   MAIL_PASSWORD=jcod aqfq cobl mqnw
   
   # ✅ Correct
   MAIL_PASSWORD=jcodaqfqcoblmqnw
   ```

2. **Backend Not Running**
   - **Check:** Visit http://localhost:8080/actuator/health
   - **Fix:** Start backend with `cd backend && mvn spring-boot:run`

3. **Database Connection Issue**
   - **Check:** Backend logs for database errors
   - **Fix:** Verify database credentials in `backend/.env`
   - **Test:** Try connecting to database directly

4. **CORS Issue**
   - **Check:** Browser console for CORS errors
   - **Fix:** Verify `@CrossOrigin(origins = "*")` is on AuthController
   - **Alternative:** Add CORS configuration in SecurityConfig

5. **Password Validation**
   - **Check:** Password must be at least 8 characters
   - **Fix:** Frontend now validates before sending

6. **Email Already Registered**
   - **Check:** Try with a different email
   - **Fix:** Use a unique email or delete existing user from database

#### Debug Steps:

1. **Open Browser Console** (F12)
   - Check for JavaScript errors
   - Look at Network tab for failed requests
   - Check the actual error response

2. **Check Backend Logs**
   ```bash
   # Look for errors in the terminal where backend is running
   # Common errors:
   # - "Failed to send email"
   # - "Email already registered"
   # - "Invalid email format"
   ```

3. **Test Backend Directly**
   ```bash
   curl -X POST http://localhost:8080/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "fullName": "Test User"
     }'
   ```

4. **Check Email Service**
   - Verify Gmail app password is correct
   - Check if 2-Step Verification is enabled on Gmail
   - Try generating a new app password

#### Quick Fix: Disable OTP (Development Only)

If you need to test without email, temporarily modify `AuthService.java`:

```java
// Comment out OTP sending
public void register(RegisterRequest req) {
    // ... existing code ...
    userRepo.save(user);
    // otpService.generateAndSend(req.email(), OtpPurpose.REGISTRATION); // DISABLED
}

// Auto-verify on registration
public AuthResponse verifyRegistration(VerifyOtpRequest req) {
    // Skip OTP check for development
    UserEntity user = userRepo.findByEmail(req.email())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    user.setVerified(true);
    userRepo.save(user);
    String token = jwtUtil.generateToken(user.getEmail());
    return new AuthResponse(token, toDto(user));
}
```

---

## Login Issues

### Problem: "Invalid email or password"

1. **Check:** Email is registered and verified
2. **Check:** Password is correct
3. **Check:** User exists in database

### Problem: "Email not verified"

1. **Solution:** Complete registration OTP verification first
2. **Alternative:** Manually set `is_verified = true` in database

---

## OTP Issues

### Problem: "Invalid or expired OTP"

1. **Check:** OTP expires in 10 minutes
2. **Check:** OTP is 6 digits
3. **Check:** Email was actually sent (check spam folder)
4. **Fix:** Click "Resend OTP" to get a new code

### Problem: "OTP email not received"

1. **Check spam/junk folder**
2. **Check backend logs** for email sending errors
3. **Verify Gmail credentials** in backend/.env
4. **Test email service:**
   ```bash
   # Check if email service is working
   curl -X POST http://localhost:8080/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"YOUR_EMAIL","password":"test1234","fullName":"Test"}'
   ```

---

## File Upload Issues

### Problem: "Upload failed"

1. **Check:** MinIO is running
   ```bash
   docker ps | grep minio
   ```

2. **Start MinIO if not running:**
   ```bash
   docker start civilai-minio
   ```

3. **Check bucket exists:**
   - Visit http://localhost:9001
   - Login: minioadmin / minioadmin123
   - Verify "civilai-files" bucket exists

4. **Check file size:**
   - Max size: 50MB
   - Configured in application.yml

---

## Analysis Issues

### Problem: "Analysis failed"

1. **Check AI Gateway is running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Start AI Gateway if needed:**
   ```bash
   cd ai-gateway
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   uvicorn app.main:app --reload --port 8000
   ```

3. **Check API keys in ai-gateway/.env:**
   ```env
   GROQ_API_KEY=your_key_here
   GEMINI_API_KEY=your_key_here
   ```

---

## Network Issues

### Problem: "Network Error" or "ERR_CONNECTION_REFUSED"

1. **Check all services are running:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8080
   - AI Gateway: http://localhost:8000
   - MinIO: http://localhost:9000

2. **Check firewall settings**

3. **Check environment variables:**
   ```bash
   # Frontend
   cat frontend/.env
   # Should have: VITE_API_BASE_URL=http://localhost:8080/api
   
   # Backend
   cat backend/.env
   # Should have all required variables
   ```

---

## Database Issues

### Problem: "Connection refused" or "Database error"

1. **Check Neon database is accessible:**
   ```bash
   psql "postgresql://neondb_owner:PASSWORD@HOST/neondb?sslmode=require"
   ```

2. **Verify credentials in backend/.env**

3. **Check Flyway migrations:**
   ```bash
   # Backend logs should show:
   # "Flyway migration completed successfully"
   ```

4. **Reset database (if needed):**
   - Go to Neon dashboard
   - Delete and recreate database
   - Restart backend (migrations will run automatically)

---

## Common Error Messages

### "Email already registered"
- **Cause:** Email exists in database
- **Fix:** Use different email or delete existing user

### "Invalid or expired OTP"
- **Cause:** OTP is wrong or expired (10 min)
- **Fix:** Request new OTP

### "Email not verified"
- **Cause:** User didn't complete OTP verification
- **Fix:** Complete registration flow

### "Invalid credentials"
- **Cause:** Wrong email or password
- **Fix:** Check credentials or reset password

### "Token expired"
- **Cause:** JWT token expired (24 hours)
- **Fix:** Login again

---

## Development Tips

### Clear Browser Storage
```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Check Token
```javascript
// In browser console
console.log(localStorage.getItem('auth-token'))
console.log(localStorage.getItem('auth-user'))
```

### Test API Directly
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234"}' \
  | jq -r '.token')

# Use token
curl http://localhost:8080/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

### Restart All Services
```bash
# Stop all
docker stop civilai-minio
# Kill backend (Ctrl+C)
# Kill AI gateway (Ctrl+C)
# Kill frontend (Ctrl+C)

# Start all
docker start civilai-minio
cd backend && mvn spring-boot:run &
cd ai-gateway && uvicorn app.main:app --reload --port 8000 &
cd frontend && npm run dev &
```

---

## Getting Help

1. **Check logs first:**
   - Browser console (F12)
   - Backend terminal
   - AI Gateway terminal

2. **Search error message** in:
   - This troubleshooting guide
   - README.md
   - Implementation docs

3. **Common fixes:**
   - Restart services
   - Clear browser cache
   - Check environment variables
   - Verify all services are running

4. **Still stuck?**
   - Check GitHub issues
   - Review implementation documents
   - Contact support

---

**Last Updated:** May 16, 2026
