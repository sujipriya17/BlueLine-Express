package com.blueline.express.service.impl;

import com.blueline.express.exception.InvalidBookingException;
import com.blueline.express.service.PaymentService;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Resolves PaymentService implementation at runtime (Polymorphism + Map collection).
 */
@Component
public class PaymentServiceFactory {
    private final Map<String, PaymentService> registry = new HashMap<>();

    public PaymentServiceFactory(
        UpiPaymentServiceImpl upi,
        CardPaymentServiceImpl card,
        NetBankingPaymentServiceImpl netBanking
    ) {
        registry.put("UPI", upi);
        registry.put("DEBIT_CARD", card);
        registry.put("CREDIT_CARD", card);
        registry.put("NET_BANKING", netBanking);
    }

    public PaymentService resolve(String method) {
        PaymentService service = registry.get(method);
        if (service == null) {
            throw new InvalidBookingException("Unsupported payment method: " + method);
        }
        return service;
    }
}
