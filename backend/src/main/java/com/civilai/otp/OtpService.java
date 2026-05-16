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
            case REGISTRATION -> "CivilAI — Verify your email";
            case LOGIN -> "CivilAI — Your login OTP";
            case PASSWORD_RESET -> "CivilAI — Password reset OTP";
        };

        emailService.sendOtpEmail(email, otp, subject, purpose, expiryMinutes);
        log.info("OTP sent to {} for purpose {}", email, purpose);
    }

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
