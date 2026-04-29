package com.tallerzapata.backend.api.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tallerzapata.backend.testsupport.TestDatabaseCleaner;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthMetricsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MeterRegistry meterRegistry;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TestDatabaseCleaner cleaner;

    @BeforeEach
    void preparePasswordHash() {
        jdbcTemplate.update(
                "UPDATE usuarios SET password_hash = ? WHERE id = ?",
                passwordEncoder.encode("password"),
                1L
        );
    }

    @Test
    void shouldIncreaseLoginSuccessMetric() throws Exception {
        double before = counter("auth.login.total", "result", "success", "reason", "none");

        LoginRequest request = new LoginRequest("admin@tallerzapata.local", "password");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk());

        double after = counter("auth.login.total", "result", "success", "reason", "none");
        assertThat(after).isEqualTo(before + 1d);
    }

    @Test
    void shouldIncreaseLoginFailureMetric() throws Exception {
        double before = counter("auth.login.total", "result", "failure", "reason", "invalid_credentials");

        LoginRequest request = new LoginRequest("admin@tallerzapata.local", "bad-password");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isUnauthorized());

        double after = counter("auth.login.total", "result", "failure", "reason", "invalid_credentials");
        assertThat(after).isEqualTo(before + 1d);
    }

    @Test
    void shouldIncreaseRefreshReusedMetric() throws Exception {
        double before = counter("auth.refresh.total", "result", "failure", "reason", "reused");

        LoginRequest loginRequest = new LoginRequest("admin@tallerzapata.local", "password");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String firstRefreshToken = objectMapper.readTree(loginResult.getResponse().getContentAsByteArray())
                .get("refreshToken")
                .asText();

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new RefreshTokenRequest(firstRefreshToken))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new RefreshTokenRequest(firstRefreshToken))))
                .andExpect(status().isUnauthorized());

        double after = counter("auth.refresh.total", "result", "failure", "reason", "reused");
        assertThat(after).isEqualTo(before + 1d);
    }

    private double counter(String name, String... tags) {
        io.micrometer.core.instrument.Counter counter = meterRegistry.find(name).tags(tags).counter();
        return counter == null ? 0d : counter.count();
    }
}
