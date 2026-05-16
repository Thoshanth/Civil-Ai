package com.civilai.auth.dto;

public record AuthResponse(
        String token,
        UserDTO user
) {}
