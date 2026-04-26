package com.tallerzapata.backend.infrastructure.observability;

import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AuthMetricsService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuthMetricsService.class);

    private final MeterRegistry meterRegistry;

    public AuthMetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public void loginSuccess() {
        meterRegistry.counter("auth.login.total", "result", "success", "reason", "none").increment();
    }

    public void loginFailure(String reason) {
        meterRegistry.counter("auth.login.total", "result", "failure", "reason", normalizeReason(reason)).increment();
        LOGGER.warn("AUTH_LOGIN_FAILURE reason={}", normalizeReason(reason));
    }

    public void refreshSuccess() {
        meterRegistry.counter("auth.refresh.total", "result", "success", "reason", "none").increment();
    }

    public void refreshFailure(String reason) {
        meterRegistry.counter("auth.refresh.total", "result", "failure", "reason", normalizeReason(reason)).increment();
        LOGGER.warn("AUTH_REFRESH_FAILURE reason={}", normalizeReason(reason));
    }

    public void logoutSuccess(String scope) {
        meterRegistry.counter("auth.logout.total", "result", "success", "scope", normalizeScope(scope)).increment();
    }

    private String normalizeReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return "unknown";
        }
        return reason.trim().toLowerCase();
    }

    private String normalizeScope(String scope) {
        if (scope == null || scope.isBlank()) {
            return "unknown";
        }
        return scope.trim().toLowerCase();
    }
}
