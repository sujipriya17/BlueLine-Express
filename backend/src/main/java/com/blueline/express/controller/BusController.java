package com.blueline.express.controller;

import com.blueline.express.dto.AdminDtos.*;
import com.blueline.express.entity.Bus;
import com.blueline.express.exception.InvalidBookingException;
import com.blueline.express.repository.BusRepository;
import com.blueline.express.repository.RouteRepository;
import com.blueline.express.repository.SeatRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/buses")
public class BusController {

    private final BusRepository busRepository;
    private final RouteRepository routeRepository;
    private final SeatRepository seatRepository;

    public BusController(BusRepository busRepository, RouteRepository routeRepository, SeatRepository seatRepository) {
        this.busRepository = busRepository;
        this.routeRepository = routeRepository;
        this.seatRepository = seatRepository;
    }

    @GetMapping("/popular-routes")
    public List<RouteDto> getPopularRoutes() {
        return routeRepository.findByActiveTrue().stream()
            .map(r -> new RouteDto(
                r.getId(),
                r.getOriginDistrict(),
                r.getDestinationDistrict(),
                r.getDistanceKm(),
                r.getEstimatedDuration(),
                r.getBaseFare(),
                r.getActive(),
                busRepository.countByOriginDistrictIgnoreCaseAndDestinationDistrictIgnoreCaseAndStatus(
                    r.getOriginDistrict(), r.getDestinationDistrict(), "ACTIVE"
                )
            ))
            .toList();
    }

    @GetMapping("/search")
    public List<BusDto> searchBuses(
        @RequestParam String origin,
        @RequestParam String destination,
        @RequestParam String date
    ) {
        if (origin.trim().equalsIgnoreCase(destination.trim())) {
            throw new InvalidBookingException("Origin and destination districts cannot be the same.");
        }
        LocalDate parsedDate = LocalDate.parse(date.trim());
        return busRepository.searchSchedules(origin.trim(), destination.trim(), parsedDate).stream()
            .map(this::toBusDto)
            .toList();
    }

    @GetMapping("/{id}")
    public BusDto getBus(@PathVariable Long id) {
        Bus bus = busRepository.findById(id)
            .orElseThrow(() -> new InvalidBookingException("Bus schedule not found."));
        return toBusDto(bus);
    }

    @GetMapping("/{id}/seats")
    public List<SeatDto> getBusSeats(@PathVariable Long id) {
        return seatRepository.findByBusIdOrderByDeckAscIdAsc(id).stream()
            .map(s -> new SeatDto(
                s.getId(), s.getBus().getId(), s.getSeatNumber(), s.getDeck(), s.getSeatType(), s.getStatus(), s.getPrice()
            ))
            .toList();
    }

    private BusDto toBusDto(Bus b) {
        long available = seatRepository.countByBusIdAndStatus(b.getId(), "AVAILABLE");
        return new BusDto(
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
            available,
            b.getFare(),
            b.getRating(),
            b.getStatus()
        );
    }
}
