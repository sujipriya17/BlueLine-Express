package com.blueline.express.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "passengers")
@PrimaryKeyJoinColumn(name = "user_id")
public class Passenger extends User {

    @Column(nullable = false)
    private Integer loyaltyPoints = 100;

    @OneToMany(mappedBy = "passenger", fetch = FetchType.LAZY)
    private List<Booking> bookings = new ArrayList<>();

    public Passenger() {
        setRole("PASSENGER");
    }

    @Override
    public String getAccountSummary() {
        return String.format("Passenger[%s, Loyalty=%d pts]", getFullName(), loyaltyPoints);
    }

    public void addLoyaltyPoints(int points) {
        if (points > 0) {
            this.loyaltyPoints += points;
        }
    }

    public Integer getLoyaltyPoints() { return loyaltyPoints; }
    public void setLoyaltyPoints(Integer loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }

    public List<Booking> getBookings() { return bookings; }
    public void setBookings(List<Booking> bookings) { this.bookings = bookings; }
}
