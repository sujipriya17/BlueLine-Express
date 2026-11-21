package com.blueline.express.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public class BookingDtos {

    public record PassengerInput(
        @NotNull Long seatId,
        String seatNumber,
        @NotBlank String passengerName,
        @NotNull @Min(1) @Max(120) Integer age,
        @NotBlank String gender,
        @NotBlank String contactPhone
    ) {}

    public record CreateBookingRequest(
        @NotNull Long busId,
        @NotEmpty List<Long> seatIds,
        @NotEmpty List<PassengerInput> passengers,
        @NotBlank String paymentMethod,
        Boolean simulateFailure
    ) {}

    public record CancelBookingRequest(
        @NotBlank @Size(min = 3, max = 300) String reason
    ) {}

    public record PaymentSummaryDto(
        String transactionReference,
        String paymentMethod,
        Double amount,
        String status,
        String gatewayNote,
        String paidAt
    ) {}

    public record RefundPolicyDto(
        Integer refundPercentage,
        Double refundAmount,
        String policyLabel
    ) {}

    public record CancellationSummaryDto(
        Long id,
        Double refundAmount,
        String refundStatus,
        String cancellationStatus,
        String cancelledAt,
        String reason
    ) {}

    public record PassengerDetailDto(
        Long id,
        Long seatId,
        String seatNumber,
        String passengerName,
        Integer age,
        String gender,
        String contactPhone
    ) {}

    public record BookingDto(
        Long id,
        String bookingReference,
        Long userId,
        String userName,
        String userEmail,
        String userPhone,
        Long busId,
        String busName,
        String registrationNumber,
        String originDistrict,
        String destinationDistrict,
        String journeyDate,
        String departureTime,
        String arrivalTime,
        String duration,
        String acType,
        String seatCategory,
        Double totalFare,
        Integer passengerCount,
        String status,
        String bookingDate,
        String cancelledAt,
        String cancellationReason,
        RefundPolicyDto refundPolicy,
        PaymentSummaryDto payment,
        CancellationSummaryDto cancellation,
        List<PassengerDetailDto> passengers
    ) {}

    public record CancellationHistoryDto(
        Long id,
        Long bookingId,
        Long userId,
        String bookingReference,
        String busName,
        String registrationNumber,
        String originDistrict,
        String destinationDistrict,
        String journeyDate,
        Integer passengerCount,
        Double totalFare,
        String reason,
        Double refundAmount,
        String refundStatus,
        String cancellationStatus,
        String cancelledAt
    ) {}
}
