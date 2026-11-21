package com.blueline.express.config;

import com.blueline.express.entity.Bus;
import com.blueline.express.entity.Route;
import com.blueline.express.entity.Seat;
import com.blueline.express.repository.BusRepository;
import com.blueline.express.repository.RouteRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RouteRepository routeRepository;
    private final BusRepository busRepository;

    public DataInitializer(RouteRepository routeRepository, BusRepository busRepository) {
        this.routeRepository = routeRepository;
        this.busRepository = busRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (routeRepository.count() > 0) return;

        List<Route> routes = List.of(
            createRoute("Chennai", "Madurai", 462, "7h 45m", 850.0),
            createRoute("Madurai", "Chennai", 462, "7h 45m", 850.0),
            createRoute("Chennai", "Coimbatore", 506, "8h 30m", 920.0),
            createRoute("Coimbatore", "Chennai", 506, "8h 30m", 920.0),
            createRoute("Chennai", "Tiruchirappalli", 332, "5h 45m", 650.0),
            createRoute("Chennai", "Tirunelveli", 624, "10h 15m", 1100.0),
            createRoute("Coimbatore", "Kanniyakumari", 446, "8h 00m", 890.0),
            createRoute("Chennai", "Salem", 345, "6h 00m", 680.0),
            createRoute("Coimbatore", "Madurai", 214, "4h 15m", 480.0),
            createRoute("Thanjavur", "Chennai", 342, "6h 15m", 690.0)
        );
        routeRepository.saveAll(routes);

        LocalDate today = LocalDate.now();
        int[] offsets = {0, 1, 2, 3, 5};
        for (int i = 0; i < offsets.length; i++) {
            LocalDate date = today.plusDays(offsets[i]);
            saveBusWithSeats(routes.get(0), "BlueLine Pandian Volvo Multi-Axle", "TN01BL10" + (i + 1),
                "Chennai", "Madurai", date, "21:15", "05:00", "7h 45m", "AC", "SLEEPER", 30, 1050.0, 4.8);
            saveBusWithSeats(routes.get(2), "BlueLine Kovai Benz Sleeper", "TN37BL30" + (i + 1),
                "Chennai", "Coimbatore", date, "22:00", "06:30", "8h 30m", "AC", "SLEEPER", 30, 1180.0, 4.8);
            saveBusWithSeats(routes.get(4), "BlueLine Rockfort Shuttle", "TN45BL50" + (i + 1),
                "Chennai", "Tiruchirappalli", date, "08:15", "14:00", "5h 45m", "AC", "SEATER", 40, 650.0, 4.7);
        }
    }

    private Route createRoute(String origin, String dest, int dist, String dur, double fare) {
        Route r = new Route();
        r.setOriginDistrict(origin);
        r.setDestinationDistrict(dest);
        r.setDistanceKm(dist);
        r.setEstimatedDuration(dur);
        r.setBaseFare(fare);
        r.setActive(true);
        return r;
    }

    private void saveBusWithSeats(
        Route route, String name, String reg, String origin, String dest, LocalDate date,
        String dep, String arr, String dur, String ac, String cat, int totalSeats, double fare, double rating
    ) {
        Bus bus = new Bus();
        bus.setRoute(route);
        bus.setBusName(name);
        bus.setRegistrationNumber(reg);
        bus.setOriginDistrict(origin);
        bus.setDestinationDistrict(dest);
        bus.setJourneyDate(date);
        bus.setDepartureTime(dep);
        bus.setArrivalTime(arr);
        bus.setDuration(dur);
        bus.setAcType(ac);
        bus.setSeatCategory(cat);
        bus.setTotalSeats(totalSeats);
        bus.setFare(fare);
        bus.setRating(rating);
        bus.setStatus("ACTIVE");

        List<Seat> seats = new ArrayList<>();
        if ("SLEEPER".equals(cat)) {
            int half = totalSeats / 2;
            for (int s = 1; s <= half; s++) {
                seats.add(createSeat(bus, "L" + s, "LOWER", "SLEEPER", fare));
            }
            for (int s = 1; s <= totalSeats - half; s++) {
                seats.add(createSeat(bus, "U" + s, "UPPER", "SLEEPER", Math.round(fare * 0.95)));
            }
        } else {
            for (int s = 1; s <= totalSeats; s++) {
                seats.add(createSeat(bus, "A" + s, "LOWER", "SEATER", fare));
            }
        }
        bus.setSeats(seats);
        busRepository.save(bus);
    }

    private Seat createSeat(Bus bus, String num, String deck, String type, double price) {
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
