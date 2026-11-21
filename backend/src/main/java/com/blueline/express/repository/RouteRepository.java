package com.blueline.express.repository;

import com.blueline.express.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RouteRepository extends JpaRepository<Route, Long> {
    List<Route> findByActiveTrue();
    Optional<Route> findFirstByOriginDistrictIgnoreCaseAndDestinationDistrictIgnoreCase(String origin, String destination);
}
