package com.blueline.express.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @Column(nullable = false, unique = true, length = 40)
    private String transactionReference;

    @Column(nullable = false, length = 25)
    private String paymentMethod; // UPI, DEBIT_CARD, CREDIT_CARD, NET_BANKING

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false, length = 20)
    private String status; // SUCCESS, FAILED, REFUNDED

    @Column(length = 255)
    private String gatewayNote;

    @Column(nullable = false)
    private LocalDateTime paidAt;

    @PrePersist
    protected void onCreate() {
        if (this.paidAt == null) {
            this.paidAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getGatewayNote() { return gatewayNote; }
    public void setGatewayNote(String gatewayNote) { this.gatewayNote = gatewayNote; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}
