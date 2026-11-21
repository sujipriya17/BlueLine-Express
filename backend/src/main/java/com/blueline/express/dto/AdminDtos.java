package com.blueline.express.dto;

import java.util.List;

public class AdminDtos {

    public record BusDto(
        Long id,
        Long routeId,
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
        Integer totalSeats,
        Long availableSeats,
        Double fare,
        Double rating,
        String status
    ) {}

    public record SeatDto(
        Long id,
        Long busId,
        String seatNumber,
        String deck,
        String seatType,
        String status,
        Double price
    ) {}

    public record RouteDto(
        Long id,
        String originDistrict,
        String destinationDistrict,
        Integer distanceKm,
        String estimatedDuration,
        Double baseFare,
        Boolean active,
        Long scheduleCount
    ) {}

    public record RouteRevenueDto(
        String routeLabel,
        Long bookingCount,
        Double revenue
    ) {}

    public record AdminStatsDto(
        Long totalBuses,
        Long totalRoutes,
        Long totalPassengers,
        Long totalBookings,
        Long confirmedBookings,
        Long cancelledBookings,
        Long completedBookings,
        Double totalRevenue,
        List<RouteRevenueDto> routeRevenue
    ) {}
}
