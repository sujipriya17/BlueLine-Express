package com.blueline.express.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
        @NotBlank @Size(min = 2, max = 120) String fullName,
        @NotBlank @Email String email,
        @NotBlank String phone,
        @NotBlank @Size(min = 6) String password,
        String confirmPassword
    ) {}

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        Boolean rememberMe
    ) {}

    public record ForgotPasswordRequest(
        @NotBlank @Email String email,
        @NotBlank String phone,
        @NotBlank @Size(min = 6) String newPassword,
        String confirmPassword
    ) {}

    public record AdminSetupRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        String phone,
        @NotBlank @Size(min = 8) String password,
        @NotBlank String confirmPassword
    ) {}

    public record UserDto(
        Long id,
        String fullName,
        String email,
        String phone,
        String role,
        Integer loyaltyPoints
    ) {}

    public record AuthResponse(
        String token,
        UserDto user,
        String message
    ) {}
}
