package com.tallerzapata.backend.application.common;

public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
