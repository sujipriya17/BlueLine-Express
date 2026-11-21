package com.blueline.express.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Date;

@Component
public class JwtUtil {

    private final SecretKey secretKey;

    public JwtUtil(@Value("${blueline.jwt.secret:}") String configuredSecret) {
        byte[] keyBytes;
        if (configuredSecret != null && configuredSecret.trim().length() >= 32) {
            keyBytes = configuredSecret.trim().getBytes(StandardCharsets.UTF_8);
        } else {
            keyBytes = new byte[32];
            new SecureRandom().nextBytes(keyBytes);
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Long userId, String email, String role, boolean rememberMe) {
        long ttlMs = rememberMe ? 1000L * 60 * 60 * 24 * 14 : 1000L * 60 * 60 * 12;
        Date now = new Date();
        return Jwts.builder()
            .subject(String.valueOf(userId))
            .claim("email", email)
            .claim("role", role)
            .issuedAt(now)
            .expiration(new Date(now.getTime() + ttlMs))
            .signWith(secretKey)
            .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
