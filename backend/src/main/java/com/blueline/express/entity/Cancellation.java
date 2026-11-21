package com.blueline.express.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cancellations")
public class Cancellation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "passenger_id", nullable = false)
    private Passenger passenger;

    @Column(nullable = false, length = 30)
    private String bookingReference;

    @Column(nullable = false, length = 300)
    private String reason;

    @Column(nullable = false)
    private Double refundAmount;

    @Column(nullable = false, length = 25)
    private String refundStatus = "PROCESSED";

    @Column(nullable = false, length = 25)
    private String cancellationStatus = "CANCELLED";

    @Column(nullable = false)
    private LocalDateTime cancelledAt;

    @PrePersist
    protected void onCreate() {
        if (this.cancelledAt == null) {
            this.cancelledAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }

    public Passenger getPassenger() { return passenger; }
    public void setPassenger(Passenger passenger) { this.passenger = passenger; }

    public String getBookingReference() { return bookingReference; }
    public void setBookingReference(String bookingReference) { this.bookingReference = bookingReference; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Double getRefundAmount() { return refundAmount; }
    public void setRefundAmount(Double refundAmount) { this.refundAmount = refundAmount; }

    public String getRefundStatus() { return refundStatus; }
    public void setRefundStatus(String refundStatus) { this.refundStatus = refundStatus; }

    public String getCancellationStatus() { return cancellationStatus; }
    public void setCancellationStatus(String cancellationStatus) { this.cancellationStatus = cancellationStatus; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }
}
