package com.blueline.express.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "buses", indexes = {
    @Index(name = "idx_bus_search", columnList = "originDistrict,destinationDistrict,journeyDate,status")
})
public class Bus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    private Route route;

    @Column(nullable = false, length = 120)
    private String busName;

    @Column(nullable = false, unique = true, length = 30)
    private String registrationNumber;

    @Column(nullable = false, length = 80)
    private String originDistrict;

    @Column(nullable = false, length = 80)
    private String destinationDistrict;

    @Column(nullable = false)
    private LocalDate journeyDate;

    @Column(nullable = false, length = 10)
    private String departureTime;

    @Column(nullable = false, length = 10)
    private String arrivalTime;

    @Column(nullable = false, length = 30)
    private String duration;

    @Column(nullable = false, length = 15)
    private String acType; // AC or NON_AC

    @Column(nullable = false, length = 25)
    private String seatCategory; // SEATER, SLEEPER, SEATER_SLEEPER

    @Column(nullable = false)
    private Integer totalSeats;

    @Column(nullable = false)
    private Double fare;

    @Column(nullable = false)
    private Double rating = 4.6;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @OneToMany(mappedBy = "bus", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Seat> seats = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Route getRoute() { return route; }
    public void setRoute(Route route) { this.route = route; }

    public String getBusName() { return busName; }
    public void setBusName(String busName) { this.busName = busName; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getOriginDistrict() { return originDistrict; }
    public void setOriginDistrict(String originDistrict) { this.originDistrict = originDistrict; }

    public String getDestinationDistrict() { return destinationDistrict; }
    public void setDestinationDistrict(String destinationDistrict) { this.destinationDistrict = destinationDistrict; }

    public LocalDate getJourneyDate() { return journeyDate; }
    public void setJourneyDate(LocalDate journeyDate) { this.journeyDate = journeyDate; }

    public String getDepartureTime() { return departureTime; }
    public void setDepartureTime(String departureTime) { this.departureTime = departureTime; }

    public String getArrivalTime() { return arrivalTime; }
    public void setArrivalTime(String arrivalTime) { this.arrivalTime = arrivalTime; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getAcType() { return acType; }
    public void setAcType(String acType) { this.acType = acType; }

    public String getSeatCategory() { return seatCategory; }
    public void setSeatCategory(String seatCategory) { this.seatCategory = seatCategory; }

    public Integer getTotalSeats() { return totalSeats; }
    public void setTotalSeats(Integer totalSeats) { this.totalSeats = totalSeats; }

    public Double getFare() { return fare; }
    public void setFare(Double fare) { this.fare = fare; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<Seat> getSeats() { return seats; }
    public void setSeats(List<Seat> seats) { this.seats = seats; }
}
