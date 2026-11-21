package com.blueline.express.controller;

import com.blueline.express.entity.ContactMessage;
import com.blueline.express.repository.ContactMessageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class PublicController {

    private final ContactMessageRepository contactRepo;

    public PublicController(ContactMessageRepository contactRepo) {
        this.contactRepo = contactRepo;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "BlueLine Express Spring Boot API");
    }

    @PostMapping("/contact")
    public ResponseEntity<Map<String, Object>> submitContact(@RequestBody Map<String, String> body) {
        ContactMessage msg = new ContactMessage();
        msg.setName(body.getOrDefault("name", "").trim());
        msg.setEmail(body.getOrDefault("email", "").trim());
        msg.setPhone(body.getOrDefault("phone", "").trim());
        msg.setSubject(body.getOrDefault("subject", "").trim());
        msg.setMessage(body.getOrDefault("message", "").trim());
        ContactMessage saved = contactRepo.save(msg);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", saved.getId(),
            "message", "Thank you for contacting BlueLine Express. Your inquiry has been logged."
        ));
    }
}
