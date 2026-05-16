package com.civilai.email;

import com.civilai.otp.OtpPurpose;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendOtpEmail(String to, String otp, String subject,
                             OtpPurpose purpose, int expiryMinutes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom("CivilAI <" + fromEmail + ">");
            helper.setText(buildHtml(otp, purpose, expiryMinutes), true);

            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
        }
    }

    private String buildHtml(String otp, OtpPurpose purpose, int expiryMinutes) {
        String action = switch (purpose) {
            case REGISTRATION -> "Verify Your Email";
            case LOGIN -> "Secure Login Attempt";
            case PASSWORD_RESET -> "Reset Your Password";
        };

        String description = switch (purpose) {
            case REGISTRATION -> "Welcome to CivilAI! Please use the following code to verify your email address and activate your account.";
            case LOGIN -> "A login attempt requires verification. Please use the following code to access your account safely.";
            case PASSWORD_RESET -> "We received a request to reset your password. Use the code below to proceed.";
        };

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; text-align: center;">
                <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
                    <tr>
                        <td style="padding: 0;">
                            <!-- Header Gradient Area -->
                            <div style="background: linear-gradient(135deg, #4f46e5 0%%, #7c3aed 100%%); padding: 40px 30px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">CivilAI</h1>
                                <p style="color: #c7d2fe; margin: 8px 0 0 0; font-size: 15px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">Intelligent Engineering</p>
                            </div>
                            
                            <!-- Main Content Area -->
                            <div style="padding: 40px 40px 30px 40px; background-color: #ffffff;">
                                <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 22px; font-weight: 700;">%s</h2>
                                <p style="color: #475569; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">%s</p>
                                
                                <!-- OTP Box -->
                                <div style="background: linear-gradient(145deg, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; margin: 0 auto; max-width: 300px; box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02);">
                                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">Verification Code</p>
                                    <p style="margin: 0; color: #4f46e5; font-size: 42px; font-weight: 800; letter-spacing: 8px; font-family: monospace;">%s</p>
                                </div>
                                
                                <p style="color: #94a3b8; margin: 30px 0 0 0; font-size: 14px;">
                                    <span style="display: inline-block; background-color: #fef2f2; color: #ef4444; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-right: 6px;">⏱</span>
                                    This code will expire in <strong>%d minutes</strong>.
                                </p>
                            </div>
                            
                            <!-- Footer Area -->
                            <div style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #f1f5f9; text-align: center;">
                                <p style="color: #94a3b8; margin: 0; font-size: 13px; line-height: 1.5;">
                                    If you didn't request this code, you can safely ignore this email.<br>Your account is secure.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(action, description, otp, expiryMinutes);
    }
}
