package com.blueline.express.service.impl;

import com.blueline.express.entity.Booking;
import com.blueline.express.entity.Payment;
import com.blueline.express.exception.PaymentFailedException;
import com.blueline.express.service.PaymentService;
import java.util.UUID;

/**
 * Abstract base class demonstrating OOP Abstraction and Template Method pattern
 * across multiple payment channel implementations.
 */
public abstract class AbstractPaymentService implements PaymentService {

    protected String generateTransactionReference(String prefix) {
        return prefix + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    @Override
    public Payment processPayment(Booking booking, double amount, boolean simulateFailure) {
        if (simulateFailure) {
            throw new PaymentFailedException(
                "Simulated " + getSupportedMethod() + " payment declined. No seats reserved and no money charged."
            );
        }
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(amount);
        payment.setPaymentMethod(getSupportedMethod());
        payment.setStatus("SUCCESS");
        payment.setTransactionReference(generateTransactionReference("TXN"));
        payment.setGatewayNote(buildGatewayNote());
        return payment;
    }

    protected abstract String buildGatewayNote();
}
