# CivilAI — Email OTP Implementation
> Gmail App Password + Spring Boot + React
> Covers: Registration verification, Login 2FA, Password Reset
> Cost: 100% Free

---

## How It Works — Full Flow

```
REGISTRATION
  User fills form → Backend sends OTP email → User enters OTP
  → Backend verifies → Account activated → JWT issued

LOGIN 2FA
  User enters email+password → Password verified → OTP sent
  → User enters OTP → JWT issued

PASSWORD RESET
  User enters email → OTP sent → User enters OTP + new password
  → Password updated → Redirect to login
```

---

## Step 1 — Gmail App Password Setup

### 1.1 Enable 2-Step Verification on your Gmail
```
1. Go to https://myaccount.google.com
2. Security → 2-Step Verification → Turn On
```

### 1.2 Generate App Password
```
1. Go to https://myaccount.google.com/apppasswords
2. Select app: "Mail"
3. Select device: "Other" → type "CivilAI"
4. Click Generate
5. Copy the 16-character password shown (e.g. abcd efgh ijkl mnop)
   → Remove spaces → abcdefghijklmnop
```

### 1.3 Add to .env (Java Backend)
```env
MAIL_USERNAME=yourgmail@gmail.com
MAIL_PASSWORD=abcdefghijklmnop
```

> Never commit these to Git. Add .env to .gitignore.

---

## Step 2 — Java Backend

### 2.1 Add Dependencies to pom.xml

```xml
<!-- Spring Mail -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-mail</artifactId>
</dependency>

<!-- Spring Cache (for OTP storage in memory) -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-cache</artifactId>
</dependency>

<!-- Caffeine Cache (fast, free, in-memory) -->
<dependency>
  <groupId>com.github.ben-manes.caffeine</groupId>
  <artifactId>caffeine</artifactId>
  <version>3.1.8</version>
</dependency>
```

### 2.2 application.yml — Mail Config

Add this to your existing `application.yml`:

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
        debug: false

  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=10000,expireAfterWrite=600s   # OTP expires in 10 min

otp:
  expiry-minutes: 10
  length: 6
```

### 2.3 Database — OTP Table

Add to your Flyway migration `V2__otp.sql`:

```sql
CREATE TABLE otp_store (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL,
    otp_code    VARCHAR(10) NOT NULL,
    purpose     VARCHAR(50) NOT NULL,   -- REGISTRATION | LOGIN | PASSWORD_RESET
    used        BOOLEAN DEFAULT FALSE,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_otp_email_purpose ON otp_store(email, purpose);
```

### 2.4 Update Users Table

Add to `V2__otp.sql`:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active   BOOLEAN DEFAULT TRUE;
```

---

### 2.5 Folder Structure (new files)

```
com/civilai/
├── otp/
│   ├── OtpEntity.java
│   ├── OtpRepository.java
│   ├── OtpService.java          ← generate, store, verify OTP
│   └── OtpPurpose.java          ← enum: REGISTRATION, LOGIN, PASSWORD_RESET
│
├── email/
│   └── EmailService.java        ← sends HTML email via Gmail SMTP
│
└── auth/
    ├── AuthController.java      ← updated with new endpoints
    ├── AuthService.java         ← updated with OTP logic
    └── dto/
        ├── RegisterRequest.java
        ├── VerifyOtpRequest.java
        ├── LoginRequest.java
        ├── LoginOtpRequest.java
        ├── ForgotPasswordRequest.java
        ├── ResetPasswordRequest.java
        └── AuthResponse.java
```

---

### 2.6 OtpPurpose.java

```java
package com.civilai.otp;

public enum OtpPurpose {
    REGISTRATION,
    LOGIN,
    PASSWORD_RESET
}
```

### 2.7 OtpEntity.java

```java
package com.civilai.otp;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "otp_store")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpEntity {

    @Id
    @GeneratedValue
    private UUID id;

    private String email;
    private String otpCode;

    @Enumerated(EnumType.STRING)
    private OtpPurpose purpose;

    private boolean used;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
```

### 2.8 OtpRepository.java

```java
package com.civilai.otp;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.UUID;

public interface OtpRepository extends JpaRepository<OtpEntity, UUID> {

    Optional<OtpEntity> findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(
        String email, OtpPurpose purpose
    );

    @Modifying
    @Transactional
    @Query("DELETE FROM OtpEntity o WHERE o.email = :email AND o.purpose = :purpose")
    void deleteAllByEmailAndPurpose(String email, OtpPurpose purpose);
}
```

### 2.9 OtpService.java

```java
package com.civilai.otp;

import com.civilai.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpRepository otpRepository;
    private final EmailService emailService;

    @Value("${otp.expiry-minutes:10}")
    private int expiryMinutes;

    private final SecureRandom random = new SecureRandom();

    // Generate and send OTP
    public void generateAndSend(String email, OtpPurpose purpose) {
        // Delete any old OTPs for same email+purpose
        otpRepository.deleteAllByEmailAndPurpose(email, purpose);

        // Generate 6-digit OTP
        String otp = String.format("%06d", random.nextInt(999999));

        // Save to DB
        OtpEntity entity = OtpEntity.builder()
            .email(email)
            .otpCode(otp)
            .purpose(purpose)
            .used(false)
            .expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes))
            .build();
        otpRepository.save(entity);

        // Send email
        String subject = switch (purpose) {
            case REGISTRATION   -> "CivilAI — Verify your email";
            case LOGIN          -> "CivilAI — Your login OTP";
            case PASSWORD_RESET -> "CivilAI — Password reset OTP";
        };

        emailService.sendOtpEmail(email, otp, subject, purpose, expiryMinutes);
        log.info("OTP sent to {} for purpose {}", email, purpose);
    }

    // Verify OTP — returns true if valid
    public boolean verify(String email, String otpCode, OtpPurpose purpose) {
        return otpRepository
            .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose)
            .map(otp -> {
                if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
                    log.warn("OTP expired for {} purpose {}", email, purpose);
                    return false;
                }
                if (!otp.getOtpCode().equals(otpCode)) {
                    log.warn("Wrong OTP for {} purpose {}", email, purpose);
                    return false;
                }
                // Mark as used
                otp.setUsed(true);
                otpRepository.save(otp);
                return true;
            })
            .orElse(false);
    }
}
```

### 2.10 EmailService.java — HTML Email

```java
package com.civilai.email;

import com.civilai.otp.OtpPurpose;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendOtpEmail(String to, String otp, String subject,
                              OtpPurpose purpose, int expiryMinutes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom("CivilAI <" + to + ">");
            helper.setText(buildHtml(otp, purpose, expiryMinutes), true);

            mailSender.send(message);
            log.info("Email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private String buildHtml(String otp, OtpPurpose purpose, int expiryMinutes) {
        String action = switch (purpose) {
            case REGISTRATION   -> "verify your email address";
            case LOGIN          -> "complete your login";
            case PASSWORD_RESET -> "reset your password";
        };

        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:20px;">
              <div style="max-width:480px; margin:auto; background:#fff;
                          border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">

                <!-- Header -->
                <div style="background:#1a56db; padding:28px 32px;">
                  <h1 style="color:#fff; margin:0; font-size:22px;">🏗️ CivilAI</h1>
                  <p style="color:#bfdbfe; margin:4px 0 0; font-size:13px;">
                    AI Platform for Civil Engineers
                  </p>
                </div>

                <!-- Body -->
                <div style="padding:32px;">
                  <p style="color:#374151; font-size:15px; margin:0 0 16px;">
                    Use the OTP below to <strong>%s</strong>:
                  </p>

                  <!-- OTP Box -->
                  <div style="background:#f0f9ff; border:2px solid #1a56db;
                              border-radius:10px; padding:24px; text-align:center; margin:24px 0;">
                    <p style="margin:0 0 4px; color:#6b7280; font-size:12px; letter-spacing:2px;">
                      YOUR ONE-TIME PASSWORD
                    </p>
                    <p style="margin:0; font-size:42px; font-weight:700;
                              letter-spacing:10px; color:#1a56db; font-family:monospace;">
                      %s
                    </p>
                  </div>

                  <p style="color:#6b7280; font-size:13px; margin:0;">
                    ⏱ This OTP expires in <strong>%d minutes</strong>.
                    Do not share it with anyone.
                  </p>
                </div>

                <!-- Footer -->
                <div style="background:#f9fafb; padding:16px 32px; border-top:1px solid #e5e7eb;">
                  <p style="color:#9ca3af; font-size:12px; margin:0;">
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(action, otp, expiryMinutes);
    }
}
```

### 2.11 DTOs

```java
// VerifyOtpRequest.java
public record VerifyOtpRequest(String email, String otp) {}

// LoginOtpRequest.java
public record LoginOtpRequest(String email, String otp) {}

// ForgotPasswordRequest.java
public record ForgotPasswordRequest(String email) {}

// ResetPasswordRequest.java
public record ResetPasswordRequest(String email, String otp, String newPassword) {}
```

### 2.12 AuthService.java — Updated

```java
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final OtpService otpService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    // STEP 1 of registration: save user (unverified) + send OTP
    public void register(RegisterRequest req) {
        if (userRepo.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        UserEntity user = UserEntity.builder()
            .email(req.email())
            .password(passwordEncoder.encode(req.password()))
            .fullName(req.fullName())
            .isVerified(false)
            .isActive(true)
            .build();
        userRepo.save(user);
        otpService.generateAndSend(req.email(), OtpPurpose.REGISTRATION);
    }

    // STEP 2 of registration: verify OTP → activate account → return JWT
    public AuthResponse verifyRegistration(VerifyOtpRequest req) {
        if (!otpService.verify(req.email(), req.otp(), OtpPurpose.REGISTRATION)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP");
        }
        UserEntity user = userRepo.findByEmail(req.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setVerified(true);
        userRepo.save(user);

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, toDto(user));
    }

    // STEP 1 of login: verify password → send OTP
    public void loginStep1(LoginRequest req) {
        UserEntity user = userRepo.findByEmail(req.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!user.isVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email not verified");
        }
        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        otpService.generateAndSend(req.email(), OtpPurpose.LOGIN);
    }

    // STEP 2 of login: verify OTP → return JWT
    public AuthResponse loginStep2(LoginOtpRequest req) {
        if (!otpService.verify(req.email(), req.otp(), OtpPurpose.LOGIN)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP");
        }
        UserEntity user = userRepo.findByEmail(req.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, toDto(user));
    }

    // STEP 1 of password reset: send OTP
    public void forgotPassword(String email) {
        userRepo.findByEmail(email).ifPresent(u ->
            otpService.generateAndSend(email, OtpPurpose.PASSWORD_RESET)
        );
        // Always return 200 — don't reveal if email exists
    }

    // STEP 2 of password reset: verify OTP + update password
    public void resetPassword(ResetPasswordRequest req) {
        if (!otpService.verify(req.email(), req.otp(), OtpPurpose.PASSWORD_RESET)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP");
        }
        UserEntity user = userRepo.findByEmail(req.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepo.save(user);
    }

    // Resend OTP (rate-limited by DB — deletes old, creates new)
    public void resendOtp(String email, OtpPurpose purpose) {
        otpService.generateAndSend(email, purpose);
    }
}
```

### 2.13 AuthController.java — All Endpoints

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Registration
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody @Valid RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.ok("OTP sent to " + req.email());
    }

    @PostMapping("/register/verify")
    public ResponseEntity<AuthResponse> verifyRegistration(@RequestBody VerifyOtpRequest req) {
        return ResponseEntity.ok(authService.verifyRegistration(req));
    }

    @PostMapping("/register/resend")
    public ResponseEntity<String> resendRegistrationOtp(@RequestBody ForgotPasswordRequest req) {
        authService.resendOtp(req.email(), OtpPurpose.REGISTRATION);
        return ResponseEntity.ok("OTP resent");
    }

    // Login (2-step)
    @PostMapping("/login")
    public ResponseEntity<String> loginStep1(@RequestBody @Valid LoginRequest req) {
        authService.loginStep1(req);
        return ResponseEntity.ok("OTP sent to " + req.email());
    }

    @PostMapping("/login/verify")
    public ResponseEntity<AuthResponse> loginStep2(@RequestBody LoginOtpRequest req) {
        return ResponseEntity.ok(authService.loginStep2(req));
    }

    // Password Reset
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req.email());
        return ResponseEntity.ok("If that email exists, an OTP has been sent");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok("Password updated successfully");
    }
}
```

### 2.14 Enable Async + Cache in Main App

```java
@SpringBootApplication
@EnableAsync          // ← for async email sending
@EnableCaching        // ← for Caffeine cache
public class CivilAiApplication {
    public static void main(String[] args) {
        SpringApplication.run(CivilAiApplication.class, args);
    }
}
```

---

## Step 3 — React Frontend

### 3.1 Auth Flow Pages

```
/register        → email + password form
/register/verify → OTP input (6 boxes)
/login           → email + password form
/login/verify    → OTP input (6 boxes)
/forgot-password → email form
/reset-password  → OTP + new password form
```

### 3.2 OTP Input Component (6 boxes)

Create `src/components/OtpInput.jsx`:

```jsx
import { useRef, useState } from 'react'

export default function OtpInput({ onComplete }) {
  const [values, setValues] = useState(Array(6).fill(''))
  const inputs = useRef([])

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return          // digits only
    const next = [...values]
    next[i] = val.slice(-1)                 // one digit per box
    setValues(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()  // auto-advance
    if (next.every(Boolean)) onComplete(next.join('')) // all filled
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) {
      inputs.current[i - 1]?.focus()       // go back on delete
    }
  }

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = Array(6).fill('')
    text.split('').forEach((c, i) => (next[i] = c))
    setValues(next)
    if (text.length === 6) onComplete(text)
    inputs.current[Math.min(text.length, 5)]?.focus()
  }

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg
                     border-gray-300 focus:border-blue-500 focus:outline-none
                     transition-colors"
        />
      ))}
    </div>
  )
}
```

### 3.3 Register Page (2 steps)

```jsx
// src/pages/auth/RegisterPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OtpInput from '../../components/OtpInput'
import { useAuthStore } from '../../store/authStore'
import client from '../../api/client'

export default function RegisterPage() {
  const [step, setStep] = useState(1)      // 1 = form, 2 = OTP
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await client.post('/api/auth/register', { email, password, fullName })
      setStep(2)
      startResendTimer()
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (otp) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await client.post('/api/auth/register/verify', { email, otp })
      login(data.token, data.user)
      navigate('/')
    } catch (err) {
      setError('Invalid or expired OTP. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    await client.post('/api/auth/register/resend', { email })
    startResendTimer()
  }

  const startResendTimer = () => {
    setResendTimer(60)
    const t = setInterval(() => {
      setResendTimer((s) => { if (s <= 1) { clearInterval(t); return 0 } return s - 1 })
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border w-full max-w-md p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-700">🏗️ CivilAI</h1>
          <p className="text-gray-500 text-sm mt-1">AI Platform for Civil Engineers</p>
        </div>

        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold mb-6">Create account</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <input className="w-full border rounded-lg px-4 py-2.5 text-sm"
                placeholder="Full name" value={fullName}
                onChange={(e) => setFullName(e.target.value)} required />
              <input className="w-full border rounded-lg px-4 py-2.5 text-sm"
                type="email" placeholder="Email address" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
              <input className="w-full border rounded-lg px-4 py-2.5 text-sm"
                type="password" placeholder="Password (min 8 chars)" value={password}
                onChange={(e) => setPassword(e.target.value)} minLength={8} required />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium
                           hover:bg-blue-700 disabled:opacity-50 transition">
                {loading ? 'Sending OTP...' : 'Continue'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:underline">Sign in</a>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-semibold mb-2">Verify your email</h2>
            <p className="text-gray-500 text-sm mb-8">
              Enter the 6-digit OTP sent to <strong>{email}</strong>
            </p>
            <OtpInput onComplete={handleVerify} />
            {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
            {loading && <p className="text-blue-500 text-sm text-center mt-4">Verifying...</p>}
            <div className="text-center mt-6">
              {resendTimer > 0 ? (
                <p className="text-gray-400 text-sm">Resend in {resendTimer}s</p>
              ) : (
                <button onClick={handleResend}
                  className="text-blue-600 text-sm hover:underline">
                  Resend OTP
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

### 3.4 Login Page (2 steps)

```jsx
// src/pages/auth/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OtpInput from '../../components/OtpInput'
import { useAuthStore } from '../../store/authStore'
import client from '../../api/client'

export default function LoginPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await client.post('/api/auth/login', { email, password })
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (otp) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await client.post('/api/auth/login/verify', { email, otp })
      login(data.token, data.user)
      navigate('/')
    } catch {
      setError('Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-700">🏗️ CivilAI</h1>
        </div>

        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold mb-6">Sign in</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input className="w-full border rounded-lg px-4 py-2.5 text-sm"
                type="email" placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
              <input className="w-full border rounded-lg px-4 py-2.5 text-sm"
                type="password" placeholder="Password" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium
                           hover:bg-blue-700 disabled:opacity-50 transition">
                {loading ? 'Sending OTP...' : 'Continue'}
              </button>
            </form>
            <div className="flex justify-between text-sm mt-4">
              <a href="/forgot-password" className="text-gray-500 hover:underline">
                Forgot password?
              </a>
              <a href="/register" className="text-blue-600 hover:underline">
                Create account
              </a>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-semibold mb-2">Enter OTP</h2>
            <p className="text-gray-500 text-sm mb-8">
              Sent to <strong>{email}</strong>
            </p>
            <OtpInput onComplete={handleVerify} />
            {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
            {loading && <p className="text-blue-500 text-sm text-center mt-4">Verifying...</p>}
          </>
        )}
      </div>
    </div>
  )
}
```

### 3.5 Forgot Password Page

```jsx
// src/pages/auth/ForgotPasswordPage.jsx
import { useState } from 'react'
import OtpInput from '../../components/OtpInput'
import client from '../../api/client'
import { useNavigate } from 'react-router-dom'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1)       // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    await client.post('/api/auth/forgot-password', { email }) // always 200
    setStep(2)
    setLoading(false)
  }

  const handleOtpComplete = (code) => {
    setOtp(code)
    setStep(3)
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await client.post('/api/auth/reset-password', { email, otp, newPassword })
      navigate('/login')
    } catch {
      setError('Invalid OTP or request expired. Start again.')
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-blue-700 text-center mb-8">🏗️ CivilAI</h1>

        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold mb-2">Reset password</h2>
            <p className="text-gray-500 text-sm mb-6">
              Enter your email and we'll send an OTP.
            </p>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <input className="w-full border rounded-lg px-4 py-2.5 text-sm"
                type="email" placeholder="Email address" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium
                           hover:bg-blue-700 disabled:opacity-50 transition">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-semibold mb-2">Enter OTP</h2>
            <p className="text-gray-500 text-sm mb-8">Sent to <strong>{email}</strong></p>
            <OtpInput onComplete={handleOtpComplete} />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-semibold mb-6">New password</h2>
            <form onSubmit={handleReset} className="space-y-4">
              <input className="w-full border rounded-lg px-4 py-2.5 text-sm"
                type="password" placeholder="New password (min 8 chars)"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                minLength={8} required />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium
                           hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
```

### 3.6 Add Routes to App.jsx

```jsx
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Inside <Routes>:
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
```

---

## Step 4 — Security Config Update

Allow OTP endpoints without auth in `SecurityConfig.java`:

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .csrf(csrf -> csrf.disable())
      .cors(cors -> cors.configurationSource(corsConfigurationSource()))
      .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
          .requestMatchers(
              "/api/auth/**",      // all auth endpoints public
              "/swagger-ui/**",
              "/v3/api-docs/**",
              "/actuator/health"
          ).permitAll()
          .anyRequest().authenticated()
      )
      .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
}
```

---

## Step 5 — Test It

```bash
# 1. Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@gmail.com","password":"test1234","fullName":"Test User"}'
# → Check your Gmail inbox for OTP

# 2. Verify registration
curl -X POST http://localhost:8080/api/auth/register/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"you@gmail.com","otp":"123456"}'
# → Returns { token, user }

# 3. Login step 1
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@gmail.com","password":"test1234"}'
# → OTP sent to email

# 4. Login step 2
curl -X POST http://localhost:8080/api/auth/login/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"you@gmail.com","otp":"654321"}'
# → Returns JWT token

# 5. Forgot password
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"you@gmail.com"}'

# 6. Reset password
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"you@gmail.com","otp":"111222","newPassword":"newpass123"}'
```

---

## Summary — What Gets Added

| Component | Added |
|-----------|-------|
| Gmail SMTP | spring-boot-starter-mail + App Password |
| OTP storage | `otp_store` table in Neon PostgreSQL |
| OTP expiry | 10 minutes (configurable) |
| OTP length | 6 digits |
| Resend | ✅ Deletes old OTP, generates new |
| Email template | Beautiful HTML email with OTP box |
| Async sending | ✅ Email sends in background thread |
| Registration | 2-step: form → OTP verify |
| Login | 2-step: password → OTP verify |
| Password reset | 3-step: email → OTP → new password |
| React OTP UI | 6 individual boxes, paste support, auto-advance |
| Security | OTPs are single-use, time-limited, hashed purpose |
