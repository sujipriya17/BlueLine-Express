package com.blueline.express.repository;

import com.blueline.express.entity.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface BusRepository extends JpaRepository<Bus, Long> {
    @Query("SELECT b FROM Bus b WHERE b.status = 'ACTIVE' " +
           "AND LOWER(b.originDistrict) = LOWER(:origin) " +
           "AND LOWER(b.destinationDistrict) = LOWER(:destination) " +
           "AND b.journeyDate = :journeyDate " +
           "ORDER BY b.departureTime ASC")
    List<Bus> searchSchedules(
        @Param("origin") String origin,
        @Param("destination") String destination,
        @Param("journeyDate") LocalDate journeyDate
    );

    boolean existsByRegistrationNumberIgnoreCase(String registrationNumber);
    long countByOriginDistrictIgnoreCaseAndDestinationDistrictIgnoreCaseAndStatus(String origin, String dest, String status);
}
