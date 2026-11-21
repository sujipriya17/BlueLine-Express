package com.blueline.express.service.impl;

import com.blueline.express.entity.Booking;
import com.blueline.express.entity.Bus;
import com.blueline.express.entity.Cancellation;
import com.blueline.express.entity.Passenger;
import com.blueline.express.repository.*;
import com.blueline.express.service.ReportOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ReportServiceImpl implements ReportOperations {

    private final BookingRepository bookingRepository;
    private final CancellationRepository cancellationRepository;
    private final BusRepository busRepository;
    private final PassengerRepository passengerRepository;
    private final SeatRepository seatRepository;

    public ReportServiceImpl(
        BookingRepository bookingRepository,
        CancellationRepository cancellationRepository,
        BusRepository busRepository,
        PassengerRepository passengerRepository,
        SeatRepository seatRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.cancellationRepository = cancellationRepository;
        this.busRepository = busRepository;
        this.passengerRepository = passengerRepository;
        this.seatRepository = seatRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, List<Map<String, Object>>> buildAllReports() {
        Map<String, List<Map<String, Object>>> result = new LinkedHashMap<>();

        List<Map<String, Object>> bookingRows = new ArrayList<>();
        for (Booking b : bookingRepository.findAllByOrderByBookingDateDesc()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("booking_reference", b.getBookingReference());
            m.put("passenger_name", b.getPassenger().getFullName());
            m.put("bus_name", b.getBus().getBusName());
            m.put("origin_district", b.getBus().getOriginDistrict());
            m.put("destination_district", b.getBus().getDestinationDistrict());
            m.put("journey_date", b.getJourneyDate().toString());
            m.put("total_fare", b.getTotalFare());
            m.put("status", b.getStatus());
            bookingRows.add(m);
        }
        result.put("bookings", bookingRows);

        List<Map<String, Object>> cancelRows = new ArrayList<>();
        for (Cancellation c : cancellationRepository.findAll()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("booking_reference", c.getBookingReference());
            m.put("passenger_name", c.getPassenger().getFullName());
            m.put("reason", c.getReason());
            m.put("refund_amount", c.getRefundAmount());
            m.put("refund_status", c.getRefundStatus());
            m.put("cancelled_at", c.getCancelledAt().toString());
            cancelRows.add(m);
        }
        result.put("cancellations", cancelRows);

        List<Map<String, Object>> busRows = new ArrayList<>();
        for (Bus bus : busRepository.findAll()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("bus_name", bus.getBusName());
            m.put("registration_number", bus.getRegistrationNumber());
            m.put("origin_district", bus.getOriginDistrict());
            m.put("destination_district", bus.getDestinationDistrict());
            m.put("journey_date", bus.getJourneyDate().toString());
            m.put("fare", bus.getFare());
            m.put("booked_seats", seatRepository.countByBusIdAndStatus(bus.getId(), "BOOKED"));
            m.put("available_seats", seatRepository.countByBusIdAndStatus(bus.getId(), "AVAILABLE"));
            busRows.add(m);
        }
        result.put("buses", busRows);

        List<Map<String, Object>> passengerRows = new ArrayList<>();
        for (Passenger p : passengerRepository.findAll()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("full_name", p.getFullName());
            m.put("email", p.getEmail());
            m.put("phone", p.getPhone());
            m.put("loyalty_points", p.getLoyaltyPoints());
            passengerRows.add(m);
        }
        result.put("passengers", passengerRows);

        result.put("revenue", bookingRows);
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public String exportCsv(String reportType) {
        List<Map<String, Object>> rows = buildAllReports().getOrDefault(reportType, List.of());
        if (rows.isEmpty()) return "message\nNo records";
        List<String> headers = new ArrayList<>(rows.get(0).keySet());
        StringBuilder sb = new StringBuilder();
        sb.append(String.join(",", headers)).append("\n");
        for (Map<String, Object> row : rows) {
            List<String> vals = headers.stream()
                .map(h -> "\"" + String.valueOf(row.getOrDefault(h, "")).replace("\"", "\"\"") + "\"")
                .toList();
            sb.append(String.join(",", vals)).append("\n");
        }
        return sb.toString();
    }
}
