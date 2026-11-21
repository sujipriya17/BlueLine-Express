package com.blueline.express.service.impl;

import org.springframework.stereotype.Service;

@Service
public class UpiPaymentServiceImpl extends AbstractPaymentService {
    @Override
    public String getSupportedMethod() {
        return "UPI";
    }

    @Override
    protected String buildGatewayNote() {
        return "Simulated UPI Instant Gateway Verified (Academic Demo)";
    }
}
