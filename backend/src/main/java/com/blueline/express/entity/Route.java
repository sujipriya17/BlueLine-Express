package com.blueline.express.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "routes")
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String originDistrict;

    @Column(nullable = false, length = 80)
    private String destinationDistrict;

    @Column(nullable = false)
    private Integer distanceKm;

    @Column(nullable = false, length = 40)
    private String estimatedDuration;

    @Column(nullable = false)
    private Double baseFare;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOriginDistrict() { return originDistrict; }
    public void setOriginDistrict(String originDistrict) { this.originDistrict = originDistrict; }

    public String getDestinationDistrict() { return destinationDistrict; }
    public void setDestinationDistrict(String destinationDistrict) { this.destinationDistrict = destinationDistrict; }

    public Integer getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Integer distanceKm) { this.distanceKm = distanceKm; }

    public String getEstimatedDuration() { return estimatedDuration; }
    public void setEstimatedDuration(String estimatedDuration) { this.estimatedDuration = estimatedDuration; }

    public Double getBaseFare() { return baseFare; }
    public void setBaseFare(Double baseFare) { this.baseFare = baseFare; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
