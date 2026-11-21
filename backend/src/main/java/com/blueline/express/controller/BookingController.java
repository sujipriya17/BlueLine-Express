package com.blueline.express.controller;

import com.blueline.express.dto.BookingDtos.*;
import com.blueline.express.service.BookingOperations;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class BookingController {

    private final BookingOperations bookingOperations;

    public BookingController(BookingOperations bookingOperations) {
        this.bookingOperations = bookingOperations;
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    @PostMapping("/bookings")
    public ResponseEntity<Map<String, Object>> createBooking(
        Authentication auth,
        @Valid @RequestBody CreateBookingRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        BookingDto booking = bookingOperations.createBooking(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("booking", booking, "message", "Demo payment verified and booking confirmed."));
    }

    @GetMapping("/bookings/user/{userId}")
    public List<BookingDto> getUserBookings(@PathVariable Long userId, Authentication auth) {
        return bookingOperations.getUserBookings(userId, (Long) auth.getPrincipal(), isAdmin(auth));
    }

    @GetMapping("/bookings/{id}")
    public BookingDto getBookingDetails(@PathVariable Long id, Authentication auth) {
        return bookingOperations.getBookingDetails(id, (Long) auth.getPrincipal(), isAdmin(auth));
    }

    @PutMapping("/bookings/{id}/cancel")
    public Map<String, Object> cancelBooking(
        @PathVariable Long id,
        @Valid @RequestBody CancelBookingRequest req,
        Authentication auth
    ) {
        BookingDto updated = bookingOperations.cancelBooking(id, (Long) auth.getPrincipal(), isAdmin(auth), req.reason());
        return Map.of(
            "message", "Booking cancelled successfully and seats released.",
            "booking", updated
        );
    }

    @PostMapping("/cancellations/{bookingId}/confirm")
    public Map<String, Object> confirmCancellation(
        @PathVariable Long bookingId,
        @Valid @RequestBody CancelBookingRequest req,
        Authentication auth
    ) {
        BookingDto updated = bookingOperations.cancelBooking(bookingId, (Long) auth.getPrincipal(), isAdmin(auth), req.reason());
        return Map.of(
            "message", "Booking cancelled successfully and seats released.",
            "booking", updated
        );
    }

    @GetMapping("/bookings/{id}/ticket-file")
    public ResponseEntity<String> downloadTicket(@PathVariable Long id, Authentication auth) {
        String receipt = bookingOperations.generateTicketReceipt(id, (Long) auth.getPrincipal(), isAdmin(auth));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"BlueLine_Ticket_" + id + ".txt\"")
            .contentType(MediaType.TEXT_PLAIN)
            .body(receipt);
    }

    @GetMapping("/cancellations/user/{userId}")
    public List<CancellationHistoryDto> getCancellationHistory(@PathVariable Long userId, Authentication auth) {
        return bookingOperations.getCancellationHistory(userId, (Long) auth.getPrincipal(), isAdmin(auth));
    }
}
