package com.blueline.express.service.impl;

import org.springframework.stereotype.Service;

@Service
public class CardPaymentServiceImpl extends AbstractPaymentService {
    @Override
    public String getSupportedMethod() {
        return "CARD";
    }

    @Override
    protected String buildGatewayNote() {
        return "Simulated Debit/Credit Card Gateway Verified (Academic Demo)";
    }
}
