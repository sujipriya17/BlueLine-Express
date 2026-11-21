package com.blueline.express.exception;

public class InvalidBookingException extends RuntimeException {
    public InvalidBookingException(String message) { super(message); }
}
