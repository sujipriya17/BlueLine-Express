package com.blueline.express.service;

import com.blueline.express.entity.Booking;
import com.blueline.express.entity.Payment;

/**
 * OOP Interface for polymorphic payment gateway implementations
 * (UPI, Card, Net Banking).
 */
public interface PaymentService {
    String getSupportedMethod();
    Payment processPayment(Booking booking, double amount, boolean simulateFailure);
}
