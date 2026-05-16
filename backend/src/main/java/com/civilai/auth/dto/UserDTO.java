package com.civilai.auth.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserDTO(
        UUID id,
        String email,
        String fullName,
        String role,
        boolean isVerified,
        LocalDateTime createdAt
) {}
