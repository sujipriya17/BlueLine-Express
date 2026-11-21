package com.blueline.express.service.impl;

import com.blueline.express.dto.BookingDtos.*;
import com.blueline.express.entity.*;
import com.blueline.express.exception.*;
import com.blueline.express.repository.*;
import com.blueline.express.service.BookingOperations;
import com.blueline.express.service.PaymentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class BookingServiceImpl implements BookingOperations {

    private final BookingRepository bookingRepository;
    private final BusRepository busRepository;
    private final SeatRepository seatRepository;
    private final PassengerRepository passengerRepository;
    private final CancellationRepository cancellationRepository;
    private final PaymentServiceFactory paymentServiceFactory;

    public BookingServiceImpl(
        BookingRepository bookingRepository,
        BusRepository busRepository,
        SeatRepository seatRepository,
        PassengerRepository passengerRepository,
        CancellationRepository cancellationRepository,
        PaymentServiceFactory paymentServiceFactory
    ) {
        this.bookingRepository = bookingRepository;
        this.busRepository = busRepository;
        this.seatRepository = seatRepository;
        this.passengerRepository = passengerRepository;
        this.cancellationRepository = cancellationRepository;
        this.paymentServiceFactory = paymentServiceFactory;
    }

    @Override
    @Transactional
    public BookingDto createBooking(Long userId, CreateBookingRequest request) {
        Passenger passenger = passengerRepository.findById(userId)
            .orElseThrow(() -> new UnauthorizedAccessException("Passenger account not found."));

        Bus bus = busRepository.findById(request.busId())
            .orElseThrow(() -> new InvalidBookingException("Bus schedule not found."));

        if (!"ACTIVE".equals(bus.getStatus())) {
            throw new InvalidBookingException("Selected bus schedule is not active.");
        }

        Set<Long> uniqueSeatIds = new HashSet<>(request.seatIds());
        if (uniqueSeatIds.size() != request.seatIds().size() || uniqueSeatIds.isEmpty() || uniqueSeatIds.size() > 6) {
            throw new InvalidBookingException("Select between 1 and 6 unique seats.");
        }
        if (request.passengers().size() != uniqueSeatIds.size()) {
            throw new InvalidBookingException("Passenger details must match selected seats.");
        }

        List<Seat> seats = seatRepository.findAllByBusIdAndIdInForUpdate(bus.getId(), request.seatIds());
        if (seats.size() != uniqueSeatIds.size()) {
            throw new InvalidBookingException("One or more seats do not belong to this bus.");
        }

        Map<Long, Seat> seatMap = new HashMap<>();
        double totalFare = 0;
        for (Seat seat : seats) {
            if (!"AVAILABLE".equals(seat.getStatus())) {
                throw new SeatUnavailableException("Seat " + seat.getSeatNumber() + " is no longer available.");
            }
            seatMap.put(seat.getId(), seat);
            totalFare += seat.getPrice();
        }

        Booking booking = new Booking();
        booking.setBookingReference("BLX" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase());
        booking.setPassenger(passenger);
        booking.setBus(bus);
        booking.setTotalFare(totalFare);
        booking.setPassengerCount(seats.size());
        booking.setStatus("CONFIRMED");
        booking.setJourneyDate(bus.getJourneyDate());

        for (PassengerInput input : request.passengers()) {
            Seat seat = seatMap.get(input.seatId());
            if (seat == null) {
                throw new InvalidBookingException("Invalid seat assignment for passenger " + input.passengerName());
            }
            seat.setStatus("BOOKED");
            PassengerDetail detail = new PassengerDetail();
            detail.setSeat(seat);
            detail.setSeatNumber(seat.getSeatNumber());
            detail.setPassengerName(input.passengerName().trim());
            detail.setAge(input.age());
            detail.setGender(input.gender());
            detail.setContactPhone(input.contactPhone().trim());
            booking.addPassengerDetail(detail);
        }

        PaymentService paymentService = paymentServiceFactory.resolve(request.paymentMethod());
        Payment payment = paymentService.processPayment(booking, totalFare, Boolean.TRUE.equals(request.simulateFailure()));
        payment.setPaymentMethod(request.paymentMethod());
        booking.setPayment(payment);

        passenger.addLoyaltyPoints(Math.max(10, (int) Math.round(totalFare / 20.0)));
        Booking saved = bookingRepository.save(booking);
        return toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingDto> getUserBookings(Long targetUserId, Long requesterId, boolean isAdmin) {
        if (!Objects.equals(targetUserId, requesterId) && !isAdmin) {
            throw new UnauthorizedAccessException("Unauthorized to view another passenger's bookings.");
        }
        return bookingRepository.findByPassengerIdOrderByBookingDateDesc(targetUserId).stream()
            .map(this::toDto)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BookingDto getBookingDetails(Long bookingId, Long requesterId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new BookingNotFoundException("Booking not found."));
        if (!Objects.equals(booking.getPassenger().getId(), requesterId) && !isAdmin) {
            throw new UnauthorizedAccessException("Unauthorized access to booking.");
        }
        return toDto(booking);
    }

    @Override
    @Transactional
    public BookingDto cancelBooking(Long bookingId, Long requesterId, boolean isAdmin, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new BookingNotFoundException("Booking not found."));

        if (!Objects.equals(booking.getPassenger().getId(), requesterId) && !isAdmin) {
            throw new UnauthorizedAccessException("You are not authorized to cancel this booking.");
        }
        if ("CANCELLED".equals(booking.getStatus())) {
            throw new InvalidBookingException("This booking is already cancelled.");
        }
        if ("COMPLETED".equals(booking.getStatus())) {
            throw new InvalidBookingException("Completed journeys cannot be cancelled.");
        }
        if (reason == null || reason.trim().length() < 3) {
            throw new InvalidBookingException("Cancellation reason must be at least 3 characters.");
        }

        double refundAmount = calculateRefund(booking.getJourneyDate(), booking.getTotalFare());

        booking.setStatus("CANCELLED");
        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancellationReason(reason.trim());

        for (PassengerDetail detail : booking.getPassengerDetails()) {
            Seat seat = detail.getSeat();
            if ("BOOKED".equals(seat.getStatus())) {
                seat.setStatus("AVAILABLE");
            }
        }

        if (booking.getPayment() != null) {
            booking.getPayment().setStatus("REFUNDED");
            booking.getPayment().setGatewayNote("Refunded INR " + Math.round(refundAmount));
        }

        Cancellation cancellation = new Cancellation();
        cancellation.setBooking(booking);
        cancellation.setPassenger(booking.getPassenger());
        cancellation.setBookingReference(booking.getBookingReference());
        cancellation.setReason(reason.trim());
        cancellation.setRefundAmount(refundAmount);
        cancellation.setRefundStatus("PROCESSED");
        cancellation.setCancellationStatus("CANCELLED");
        booking.setCancellation(cancellation);

        Booking saved = bookingRepository.save(booking);
        return toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public String generateTicketReceipt(Long bookingId, Long requesterId, boolean isAdmin) {
        BookingDto dto = getBookingDetails(bookingId, requesterId, isAdmin);
        StringBuilder sb = new StringBuilder();
        sb.append("============================================================\n");
        sb.append("               BLUELINE EXPRESS - E-TICKET RECEIPT          \n");
        sb.append("============================================================\n");
        sb.append("Booking Reference : ").append(dto.bookingReference()).append("\n");
        sb.append("Status            : ").append(dto.status()).append("\n");
        sb.append("Bus Service       : ").append(dto.busName()).append(" (").append(dto.registrationNumber()).append(")\n");
        sb.append("Route             : ").append(dto.originDistrict()).append(" -> ").append(dto.destinationDistrict()).append("\n");
        sb.append("Journey Date      : ").append(dto.journeyDate()).append(" | ").append(dto.departureTime()).append("\n");
        sb.append("Total Fare        : INR ").append(dto.totalFare()).append("\n");
        sb.append("------------------------------------------------------------\n");
        for (PassengerDetailDto p : dto.passengers()) {
            sb.append("Seat ").append(p.seatNumber()).append(" : ").append(p.passengerName())
              .append(" (").append(p.age()).append(", ").append(p.gender()).append(")\n");
        }
        sb.append("============================================================\n");
        return sb.toString();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CancellationHistoryDto> getCancellationHistory(Long targetUserId, Long requesterId, boolean isAdmin) {
        if (!Objects.equals(targetUserId, requesterId) && !isAdmin) {
            throw new UnauthorizedAccessException("Unauthorized access to cancellation history.");
        }
        return cancellationRepository.findByPassengerIdOrderByCancelledAtDesc(targetUserId).stream()
            .map(c -> new CancellationHistoryDto(
                c.getId(),
                c.getBooking().getId(),
                c.getPassenger().getId(),
                c.getBookingReference(),
                c.getBooking().getBus().getBusName(),
                c.getBooking().getBus().getRegistrationNumber(),
                c.getBooking().getBus().getOriginDistrict(),
                c.getBooking().getBus().getDestinationDistrict(),
                c.getBooking().getJourneyDate().toString(),
                c.getBooking().getPassengerCount(),
                c.getBooking().getTotalFare(),
                c.getReason(),
                c.getRefundAmount(),
                c.getRefundStatus(),
                c.getCancellationStatus(),
                c.getCancelledAt().toString()
            ))
            .toList();
    }

    @Override
    public double calculateRefund(LocalDate journeyDate, double totalFare) {
        long days = ChronoUnit.DAYS.between(LocalDate.now(), journeyDate);
        if (days >= 2) return calculateRefund(totalFare, 85);
        if (days >= 1) return calculateRefund(totalFare, 70);
        return calculateRefund(totalFare, 50);
    }

    @Override
    public double calculateRefund(double totalFare, int percentage) {
        return Math.round(totalFare * (percentage / 100.0));
    }

    private BookingDto toDto(Booking b) {
        Bus bus = b.getBus();
        Passenger p = b.getPassenger();
        long days = ChronoUnit.DAYS.between(LocalDate.now(), b.getJourneyDate());
        int pct = days >= 2 ? 85 : days >= 1 ? 70 : 50;
        double expectedRefund = calculateRefund(b.getTotalFare(), pct);

        return new BookingDto(
            b.getId(),
            b.getBookingReference(),
            p.getId(),
            p.getFullName(),
            p.getEmail(),
            p.getPhone(),
            bus.getId(),
            bus.getBusName(),
            bus.getRegistrationNumber(),
            bus.getOriginDistrict(),
            bus.getDestinationDistrict(),
            b.getJourneyDate().toString(),
            bus.getDepartureTime(),
            bus.getArrivalTime(),
            bus.getDuration(),
            bus.getAcType(),
            bus.getSeatCategory(),
            b.getTotalFare(),
            b.getPassengerCount(),
            b.getStatus(),
            b.getBookingDate().toString(),
            b.getCancelledAt() != null ? b.getCancelledAt().toString() : null,
            b.getCancellationReason(),
            new RefundPolicyDto(pct, expectedRefund, pct + "% refund tier"),
            b.getPayment() != null
                ? new PaymentSummaryDto(
                    b.getPayment().getTransactionReference(),
                    b.getPayment().getPaymentMethod(),
                    b.getPayment().getAmount(),
                    b.getPayment().getStatus(),
                    b.getPayment().getGatewayNote(),
                    b.getPayment().getPaidAt().toString()
                )
                : null,
            b.getCancellation() != null
                ? new CancellationSummaryDto(
                    b.getCancellation().getId(),
                    b.getCancellation().getRefundAmount(),
                    b.getCancellation().getRefundStatus(),
                    b.getCancellation().getCancellationStatus(),
                    b.getCancellation().getCancelledAt().toString(),
                    b.getCancellation().getReason()
                )
                : null,
            b.getPassengerDetails().stream()
                .map(d -> new PassengerDetailDto(
                    d.getId(),
                    d.getSeat().getId(),
                    d.getSeatNumber(),
                    d.getPassengerName(),
                    d.getAge(),
                    d.getGender(),
                    d.getContactPhone()
                ))
                .toList()
        );
    }
}
