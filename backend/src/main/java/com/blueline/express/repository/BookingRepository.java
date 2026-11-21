package com.blueline.express.repository;

import com.blueline.express.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByPassengerIdOrderByBookingDateDesc(Long passengerId);
    List<Booking> findAllByOrderByBookingDateDesc();
    boolean existsByBusIdAndStatus(Long busId, String status);
    long countByStatus(String status);
}
