package com.blueline.express.service.impl;

import org.springframework.stereotype.Service;

@Service
public class NetBankingPaymentServiceImpl extends AbstractPaymentService {
    @Override
    public String getSupportedMethod() {
        return "NET_BANKING";
    }

    @Override
    protected String buildGatewayNote() {
        return "Simulated Net Banking Gateway Verified (Academic Demo)";
    }
}
