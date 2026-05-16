package com.civilai.auth;

import com.civilai.auth.dto.*;
import com.civilai.otp.OtpPurpose;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    // Registration
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody @Valid RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.ok("OTP sent to " + req.email());
    }

    @PostMapping("/register/verify")
    public ResponseEntity<AuthResponse> verifyRegistration(@RequestBody @Valid VerifyOtpRequest req) {
        return ResponseEntity.ok(authService.verifyRegistration(req));
    }

    @PostMapping("/register/resend")
    public ResponseEntity<String> resendRegistrationOtp(@RequestBody @Valid ForgotPasswordRequest req) {
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
    public ResponseEntity<AuthResponse> loginStep2(@RequestBody @Valid LoginOtpRequest req) {
        return ResponseEntity.ok(authService.loginStep2(req));
    }

    // Password Reset
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody @Valid ForgotPasswordRequest req) {
        authService.forgotPassword(req.email());
        return ResponseEntity.ok("If that email exists, an OTP has been sent");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody @Valid ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok("Password updated successfully");
    }
}
