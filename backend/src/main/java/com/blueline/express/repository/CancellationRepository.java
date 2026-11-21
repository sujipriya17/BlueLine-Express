package com.blueline.express.repository;

import com.blueline.express.entity.Cancellation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CancellationRepository extends JpaRepository<Cancellation, Long> {
    List<Cancellation> findByPassengerIdOrderByCancelledAtDesc(Long passengerId);
}
