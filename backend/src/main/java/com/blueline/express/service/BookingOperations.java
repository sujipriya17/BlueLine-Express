package com.blueline.express.service;

import com.blueline.express.dto.BookingDtos.*;
import java.time.LocalDate;
import java.util.List;

/**
 * OOP Interface defining core booking and cancellation contracts,
 * including overloaded refund calculation methods.
 */
public interface BookingOperations {
    BookingDto createBooking(Long userId, CreateBookingRequest request);
    List<BookingDto> getUserBookings(Long targetUserId, Long requesterId, boolean isAdmin);
    BookingDto getBookingDetails(Long bookingId, Long requesterId, boolean isAdmin);
    BookingDto cancelBooking(Long bookingId, Long requesterId, boolean isAdmin, String reason);
    String generateTicketReceipt(Long bookingId, Long requesterId, boolean isAdmin);
    List<CancellationHistoryDto> getCancellationHistory(Long targetUserId, Long requesterId, boolean isAdmin);

    // Method Overloading demonstration
    double calculateRefund(LocalDate journeyDate, double totalFare);
    double calculateRefund(double totalFare, int percentage);
}
