package com.civilai.auth;

import com.civilai.auth.dto.*;
import com.civilai.otp.OtpPurpose;
import com.civilai.otp.OtpService;
import com.civilai.user.UserEntity;
import com.civilai.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
                .role("USER")
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
        // Always return success — don't reveal if email exists
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

    private UserDTO toDto(UserEntity user) {
        return new UserDTO(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.isVerified(),
                user.getCreatedAt()
        );
    }
}
