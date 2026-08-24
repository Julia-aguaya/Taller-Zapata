package com.tallerzapata.backend.application.common;

import java.util.Map;

public class DomainConflictException extends ConflictException {
    private final String code;
    private final Map<String, Object> data;

    public DomainConflictException(String code, String message, Map<String, Object> data) {
        super(message);
        this.code = code;
        this.data = data;
    }

    public String getCode() { return code; }
    public Map<String, Object> getData() { return data; }
}
