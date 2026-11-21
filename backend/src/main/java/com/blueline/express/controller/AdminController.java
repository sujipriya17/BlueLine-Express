package com.blueline.express.controller;

import com.blueline.express.dto.AdminDtos.*;
import com.blueline.express.entity.*;
import com.blueline.express.exception.BookingNotFoundException;
import com.blueline.express.exception.InvalidBookingException;
import com.blueline.express.repository.*;
import com.blueline.express.service.ReportOperations;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final BusRepository busRepository;
    private final RouteRepository routeRepository;
    private final SeatRepository seatRepository;
    private final PassengerRepository passengerRepository;
    private final BookingRepository bookingRepository;
    private final ReportOperations reportOperations;

    public AdminController(
        BusRepository busRepository,
        RouteRepository routeRepository,
        SeatRepository seatRepository,
        PassengerRepository passengerRepository,
        BookingRepository bookingRepository,
        ReportOperations reportOperations
    ) {
        this.busRepository = busRepository;
        this.routeRepository = routeRepository;
        this.seatRepository = seatRepository;
        this.passengerRepository = passengerRepository;
        this.bookingRepository = bookingRepository;
        this.reportOperations = reportOperations;
    }

    @GetMapping("/stats")
    @Transactional(readOnly = true)
    public AdminStatsDto getStats() {
        List<Booking> all = bookingRepository.findAll();
        double revenue = all.stream()
            .filter(b -> "CONFIRMED".equals(b.getStatus()) || "COMPLETED".equals(b.getStatus()))
            .mapToDouble(Booking::getTotalFare)
            .sum();

        return new AdminStatsDto(
            busRepository.count(),
            routeRepository.count(),
            passengerRepository.count(),
            (long) all.size(),
            bookingRepository.countByStatus("CONFIRMED"),
            bookingRepository.countByStatus("CANCELLED"),
            bookingRepository.countByStatus("COMPLETED"),
            revenue,
            List.of()
        );
    }

    @GetMapping("/buses")
    @Transactional(readOnly = true)
    public List<BusDto> listBuses() {
        return busRepository.findAll().stream()
            .map(b -> new BusDto(
                b.getId(),
                b.getRoute() != null ? b.getRoute().getId() : null,
                b.getBusName(),
                b.getRegistrationNumber(),
                b.getOriginDistrict(),
                b.getDestinationDistrict(),
                b.getJourneyDate().toString(),
                b.getDepartureTime(),
                b.getArrivalTime(),
                b.getDuration(),
                b.getAcType(),
                b.getSeatCategory(),
                b.getTotalSeats(),
                seatRepository.countByBusIdAndStatus(b.getId(), "AVAILABLE"),
                b.getFare(),
                b.getRating(),
                b.getStatus()
            ))
            .toList();
    }

    @PostMapping("/buses")
    @Transactional
    public ResponseEntity<Map<String, Object>> createBus(@RequestBody Map<String, Object> body) {
        String reg = String.valueOf(body.get("registrationNumber")).trim().toUpperCase();
        if (busRepository.existsByRegistrationNumberIgnoreCase(reg)) {
            throw new InvalidBookingException("Registration number already exists.");
        }
        String origin = String.valueOf(body.get("originDistrict")).trim();
        String dest = String.valueOf(body.get("destinationDistrict")).trim();
        if (origin.equalsIgnoreCase(dest)) {
            throw new InvalidBookingException("Origin and destination cannot be identical.");
        }

        Bus bus = new Bus();
        bus.setBusName(String.valueOf(body.get("busName")).trim());
        bus.setRegistrationNumber(reg);
        bus.setOriginDistrict(origin);
        bus.setDestinationDistrict(dest);
        bus.setJourneyDate(LocalDate.parse(String.valueOf(body.get("journeyDate"))));
        bus.setDepartureTime(String.valueOf(body.get("departureTime")));
        bus.setArrivalTime(String.valueOf(body.get("arrivalTime")));
        bus.setDuration(String.valueOf(body.getOrDefault("duration", "6h 30m")));
        bus.setAcType(String.valueOf(body.getOrDefault("acType", "AC")));
        String cat = String.valueOf(body.getOrDefault("seatCategory", "SLEEPER"));
        bus.setSeatCategory(cat);
        int totalSeats = Integer.parseInt(String.valueOf(body.getOrDefault("totalSeats", 30)));
        double fare = Double.parseDouble(String.valueOf(body.getOrDefault("fare", 750)));
        bus.setTotalSeats(totalSeats);
        bus.setFare(fare);
        bus.setRating(Double.parseDouble(String.valueOf(body.getOrDefault("rating", 4.6))));
        bus.setStatus(String.valueOf(body.getOrDefault("status", "ACTIVE")));

        routeRepository.findFirstByOriginDistrictIgnoreCaseAndDestinationDistrictIgnoreCase(origin, dest)
            .ifPresent(bus::setRoute);

        List<Seat> seats = new ArrayList<>();
        if ("SLEEPER".equals(cat)) {
            int half = totalSeats / 2;
            for (int i = 1; i <= half; i++) seats.add(makeSeat(bus, "L" + i, "LOWER", "SLEEPER", fare));
            for (int i = 1; i <= totalSeats - half; i++) seats.add(makeSeat(bus, "U" + i, "UPPER", "SLEEPER", Math.round(fare * 0.95)));
        } else {
            for (int i = 1; i <= totalSeats; i++) seats.add(makeSeat(bus, "A" + i, "LOWER", "SEATER", fare));
        }
        bus.setSeats(seats);
        Bus saved = busRepository.save(bus);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", saved.getId(), "message", "Bus created."));
    }

    @PutMapping("/buses/{id}")
    @Transactional
    public Map<String, String> updateBus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Bus bus = busRepository.findById(id).orElseThrow(() -> new BookingNotFoundException("Bus not found."));
        if (body.containsKey("busName")) bus.setBusName(String.valueOf(body.get("busName")).trim());
        if (body.containsKey("fare")) bus.setFare(Double.parseDouble(String.valueOf(body.get("fare"))));
        if (body.containsKey("status")) bus.setStatus(String.valueOf(body.get("status")));
        busRepository.save(bus);
        return Map.of("message", "Bus updated successfully.");
    }

    @DeleteMapping("/buses/{id}")
    public Map<String, String> deleteBus(@PathVariable Long id) {
        if (bookingRepository.existsByBusIdAndStatus(id, "CONFIRMED")) {
            throw new InvalidBookingException("Cannot delete bus with active confirmed bookings.");
        }
        busRepository.deleteById(id);
        return Map.of("message", "Bus deleted successfully.");
    }

    @GetMapping("/routes")
    public List<RouteDto> listRoutes() {
        return routeRepository.findAll().stream()
            .map(r -> new RouteDto(r.getId(), r.getOriginDistrict(), r.getDestinationDistrict(),
                r.getDistanceKm(), r.getEstimatedDuration(), r.getBaseFare(), r.getActive(), 0L))
            .toList();
    }

    @PostMapping("/routes")
    public ResponseEntity<Map<String, Object>> createRoute(@RequestBody Map<String, Object> body) {
        Route r = new Route();
        r.setOriginDistrict(String.valueOf(body.get("originDistrict")).trim());
        r.setDestinationDistrict(String.valueOf(body.get("destinationDistrict")).trim());
        r.setDistanceKm(Integer.parseInt(String.valueOf(body.get("distanceKm"))));
        r.setEstimatedDuration(String.valueOf(body.get("estimatedDuration")));
        r.setBaseFare(Double.parseDouble(String.valueOf(body.get("baseFare"))));
        r.setActive(Boolean.parseBoolean(String.valueOf(body.getOrDefault("active", true))));
        Route saved = routeRepository.save(r);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", saved.getId(), "message", "Route added."));
    }

    @PutMapping("/routes/{id}")
    public Map<String, String> updateRoute(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Route r = routeRepository.findById(id).orElseThrow(() -> new BookingNotFoundException("Route not found."));
        if (body.containsKey("active")) r.setActive(Boolean.parseBoolean(String.valueOf(body.get("active"))));
        routeRepository.save(r);
        return Map.of("message", "Route updated.");
    }

    @DeleteMapping("/routes/{id}")
    public Map<String, String> deleteRoute(@PathVariable Long id) {
        routeRepository.deleteById(id);
        return Map.of("message", "Route deleted.");
    }

    @GetMapping("/passengers")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listPassengers() {
        return passengerRepository.findAll().stream()
            .map(p -> {
                List<Booking> bookings = bookingRepository.findByPassengerIdOrderByBookingDateDesc(p.getId());
                double spent = bookings.stream()
                    .filter(b -> "CONFIRMED".equals(b.getStatus()) || "COMPLETED".equals(b.getStatus()))
                    .mapToDouble(Booking::getTotalFare)
                    .sum();
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", p.getId());
                m.put("fullName", p.getFullName());
                m.put("email", p.getEmail());
                m.put("phone", p.getPhone());
                m.put("loyaltyPoints", p.getLoyaltyPoints());
                m.put("totalBookings", bookings.size());
                m.put("totalSpent", spent);
                m.put("createdAt", p.getCreatedAt().toString());
                return m;
            })
            .toList();
    }

    @GetMapping("/passengers/{id}/bookings")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listPassengerBookings(@PathVariable Long id) {
        return bookingRepository.findByPassengerIdOrderByBookingDateDesc(id).stream()
            .map(b -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", b.getId());
                m.put("bookingReference", b.getBookingReference());
                m.put("busName", b.getBus().getBusName());
                m.put("originDistrict", b.getBus().getOriginDistrict());
                m.put("destinationDistrict", b.getBus().getDestinationDistrict());
                m.put("journeyDate", b.getJourneyDate().toString());
                m.put("totalFare", b.getTotalFare());
                m.put("passengerCount", b.getPassengerCount());
                m.put("status", b.getStatus());
                m.put("bookingDate", b.getBookingDate().toString());
                return m;
            })
            .toList();
    }

    @GetMapping("/bookings")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listBookings() {
        return bookingRepository.findAllByOrderByBookingDateDesc().stream()
            .map(b -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", b.getId());
                m.put("bookingReference", b.getBookingReference());
                m.put("userId", b.getPassenger().getId());
                m.put("userName", b.getPassenger().getFullName());
                m.put("userEmail", b.getPassenger().getEmail());
                m.put("userPhone", b.getPassenger().getPhone());
                m.put("busId", b.getBus().getId());
                m.put("busName", b.getBus().getBusName());
                m.put("registrationNumber", b.getBus().getRegistrationNumber());
                m.put("originDistrict", b.getBus().getOriginDistrict());
                m.put("destinationDistrict", b.getBus().getDestinationDistrict());
                m.put("journeyDate", b.getJourneyDate().toString());
                m.put("departureTime", b.getBus().getDepartureTime());
                m.put("totalFare", b.getTotalFare());
                m.put("passengerCount", b.getPassengerCount());
                m.put("status", b.getStatus());
                m.put("bookingDate", b.getBookingDate().toString());
                if (b.getPayment() != null) {
                    m.put("transactionReference", b.getPayment().getTransactionReference());
                    m.put("paymentMethod", b.getPayment().getPaymentMethod());
                    m.put("paymentStatus", b.getPayment().getStatus());
                }
                if (b.getCancellation() != null) {
                    m.put("refundAmount", b.getCancellation().getRefundAmount());
                    m.put("cancellationReason", b.getCancellation().getReason());
                }
                return m;
            })
            .toList();
    }

    @PutMapping("/bookings/{id}/status")
    @Transactional
    public Map<String, String> updateBookingStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (!List.of("CONFIRMED", "COMPLETED", "CANCELLED").contains(status)) {
            throw new InvalidBookingException("Invalid booking status.");
        }
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new BookingNotFoundException("Booking not found."));
        if ("CANCELLED".equals(booking.getStatus()) && !"CANCELLED".equals(status)) {
            throw new InvalidBookingException("Cancelled bookings cannot be reverted.");
        }
        booking.setStatus(status);
        if ("CANCELLED".equals(status)) {
            for (PassengerDetail d : booking.getPassengerDetails()) {
                if ("BOOKED".equals(d.getSeat().getStatus())) {
                    d.getSeat().setStatus("AVAILABLE");
                }
            }
        }
        bookingRepository.save(booking);
        return Map.of("message", "Booking status updated to " + status);
    }

    @GetMapping("/buses/{id}/seats")
    public List<SeatDto> listBusSeats(@PathVariable Long id) {
        return seatRepository.findByBusIdOrderByDeckAscIdAsc(id).stream()
            .map(s -> new SeatDto(s.getId(), s.getBus().getId(), s.getSeatNumber(), s.getDeck(), s.getSeatType(), s.getStatus(), s.getPrice()))
            .toList();
    }

    @PutMapping("/seats/{id}/toggle")
    @Transactional
    public Map<String, Object> toggleSeat(@PathVariable Long id) {
        Seat seat = seatRepository.findById(id).orElseThrow(() -> new BookingNotFoundException("Seat not found."));
        if ("BOOKED".equals(seat.getStatus())) {
            throw new InvalidBookingException("Booked seats cannot be modified.");
        }
        String next = "BLOCKED".equals(seat.getStatus()) ? "AVAILABLE" : "BLOCKED";
        seat.setStatus(next);
        seatRepository.save(seat);
        return Map.of("id", id, "status", next, "message", "Seat " + seat.getSeatNumber() + " updated to " + next);
    }

    @GetMapping("/reports/bookings")
    public ResponseEntity<?> getReports(
        @RequestParam(defaultValue = "bookings") String type,
        @RequestParam(defaultValue = "json") String format
    ) {
        if ("csv".equalsIgnoreCase(format)) {
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"BlueLine_" + type + "_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(reportOperations.exportCsv(type));
        }
        return ResponseEntity.ok(reportOperations.buildAllReports());
    }

    private Seat makeSeat(Bus bus, String num, String deck, String type, double price) {
        Seat s = new Seat();
        s.setBus(bus);
        s.setSeatNumber(num);
        s.setDeck(deck);
        s.setSeatType(type);
        s.setStatus("AVAILABLE");
        s.setPrice(price);
        return s;
    }
}
