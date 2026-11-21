package com.blueline.express.controller;

import com.blueline.express.dto.AuthDtos.*;
import com.blueline.express.entity.Admin;
import com.blueline.express.entity.Passenger;
import com.blueline.express.entity.User;
import com.blueline.express.exception.InvalidBookingException;
import com.blueline.express.exception.UnauthorizedAccessException;
import com.blueline.express.exception.UserAlreadyExistsException;
import com.blueline.express.repository.PassengerRepository;
import com.blueline.express.repository.UserRepository;
import com.blueline.express.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PassengerRepository passengerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${blueline.admin.passcode:}")
    private String configuredAdminPasscode;

    public AuthController(
        UserRepository userRepository,
        PassengerRepository passengerRepository,
        PasswordEncoder passwordEncoder,
        JwtUtil jwtUtil
    ) {
        this.userRepository = userRepository;
        this.passengerRepository = passengerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        if (req.confirmPassword() != null && !req.password().equals(req.confirmPassword())) {
            throw new InvalidBookingException("Passwords do not match.");
        }
        String email = req.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new UserAlreadyExistsException("An account with this email already exists.");
        }

        Passenger passenger = new Passenger();
        passenger.setFullName(req.fullName().trim());
        passenger.setEmail(email);
        passenger.setPhone(req.phone().trim());
        passenger.setPasswordHash(passwordEncoder.encode(req.password()));
        passenger.setLoyaltyPoints(100);

        Passenger saved = passengerRepository.save(passenger);
        String token = jwtUtil.generateToken(saved.getId(), saved.getEmail(), "PASSENGER", false);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(new AuthResponse(token, toDto(saved), "Registration successful."));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        User user = userRepository.findByEmailIgnoreCase(req.email().trim())
            .orElseThrow(() -> new UnauthorizedAccessException("Invalid email or password."));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }
        if (!"PASSENGER".equals(user.getRole())) {
            throw new UnauthorizedAccessException("Please use the Administrator Portal.");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole(), Boolean.TRUE.equals(req.rememberMe()));
        return new AuthResponse(token, toDto(user), "Login successful.");
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        if (req.confirmPassword() != null && !req.newPassword().equals(req.confirmPassword())) {
            throw new InvalidBookingException("Passwords do not match.");
        }
        User user = userRepository.findByEmailIgnoreCase(req.email().trim())
            .orElseThrow(() -> new InvalidBookingException("Email and phone do not match our records."));
        if (!user.getPhone().equals(req.phone().trim()) || !"PASSENGER".equals(user.getRole())) {
            throw new InvalidBookingException("Email and phone do not match our records.");
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
        return Map.of("message", "Password reset successfully.");
    }

    @GetMapping("/me")
    public Map<String, UserDto> me(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UnauthorizedAccessException("User not found."));
        return Map.of("user", toDto(user));
    }

    @GetMapping("/admin-status")
    public Map<String, Boolean> adminStatus() {
        boolean hasAdmin = userRepository.existsByRole("ADMIN");
        boolean envConfigured = configuredAdminPasscode != null && !configuredAdminPasscode.isBlank();
        return Map.of(
            "adminConfigured", hasAdmin || envConfigured,
            "requiresInitialSetup", !hasAdmin && !envConfigured
        );
    }

    @PostMapping("/admin-setup")
    public ResponseEntity<AuthResponse> setupAdmin(@Valid @RequestBody AdminSetupRequest req) {
        if (configuredAdminPasscode != null && !configuredAdminPasscode.isBlank()) {
            throw new UnauthorizedAccessException("Admin credentials managed by environment configuration.");
        }
        if (userRepository.existsByRole("ADMIN")) {
            throw new UserAlreadyExistsException("Administrator account already initialized.");
        }
        if (!req.password().equals(req.confirmPassword())) {
            throw new InvalidBookingException("Passwords do not match.");
        }

        Admin admin = new Admin();
        admin.setFullName(req.fullName().trim());
        admin.setEmail(req.email().trim().toLowerCase());
        admin.setPhone(req.phone() != null ? req.phone().trim() : "9840000000");
        admin.setPasswordHash(passwordEncoder.encode(req.password()));

        Admin saved = userRepository.save(admin);
        String token = jwtUtil.generateToken(saved.getId(), saved.getEmail(), "ADMIN", false);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(new AuthResponse(token, toDto(saved), "Administrator initialized."));
    }

    @PostMapping("/admin-login")
    public AuthResponse adminLogin(@Valid @RequestBody LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        if (configuredAdminPasscode != null && !configuredAdminPasscode.isBlank()) {
            boolean matchesEnv = MessageDigest.isEqual(
                req.password().getBytes(StandardCharsets.UTF_8),
                configuredAdminPasscode.trim().getBytes(StandardCharsets.UTF_8)
            );
            if (matchesEnv) {
                User admin = userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
                    Admin created = new Admin();
                    created.setFullName("Operations Administrator");
                    created.setEmail(email);
                    created.setPhone("9840000000");
                    created.setPasswordHash(passwordEncoder.encode(req.password()));
                    return userRepository.save(created);
                });
                String token = jwtUtil.generateToken(admin.getId(), admin.getEmail(), "ADMIN", false);
                return new AuthResponse(token, toDto(admin), "Admin login successful.");
            }
        }

        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new UnauthorizedAccessException("Invalid administrator credentials."));
        if (!"ADMIN".equals(user.getRole()) || !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new UnauthorizedAccessException("Invalid administrator credentials.");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), "ADMIN", false);
        return new AuthResponse(token, toDto(user), "Admin login successful.");
    }

    private UserDto toDto(User user) {
        int points = (user instanceof Passenger p) ? p.getLoyaltyPoints() : 0;
        return new UserDto(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), user.getRole(), points);
    }
}
