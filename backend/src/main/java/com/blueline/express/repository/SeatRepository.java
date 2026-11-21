package com.blueline.express.repository;

import com.blueline.express.entity.Seat;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByBusIdOrderByDeckAscIdAsc(Long busId);
    long countByBusIdAndStatus(Long busId, String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Seat s WHERE s.bus.id = :busId AND s.id IN :seatIds")
    List<Seat> findAllByBusIdAndIdInForUpdate(@Param("busId") Long busId, @Param("seatIds") List<Long> seatIds);
}
