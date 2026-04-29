package com.tallerzapata.backend.api.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tallerzapata.backend.testsupport.TestDatabaseCleaner;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    void shouldLoginAndAccessMeWithBearerToken() throws Exception {
        LoginRequest request = new LoginRequest("admin@tallerzapata.local", "password");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        JsonNode body = objectMapper.readTree(loginResult.getResponse().getContentAsByteArray());
        String accessToken = body.get("accessToken").asText();

        assertThat(accessToken).doesNotContain("pending-access-token");

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("1"))
                .andExpect(jsonPath("$.displayName").value("Admin Bootstrap"));
    }

    @Test
    void shouldRotateRefreshToken() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@tallerzapata.local", "password");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginBody = objectMapper.readTree(loginResult.getResponse().getContentAsByteArray());
        String firstRefreshToken = loginBody.get("refreshToken").asText();

        RefreshTokenRequest refreshRequest = new RefreshTokenRequest(firstRefreshToken);
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(refreshRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        JsonNode refreshBody = objectMapper.readTree(refreshResult.getResponse().getContentAsByteArray());
        String rotatedRefreshToken = refreshBody.get("refreshToken").asText();

        assertThat(rotatedRefreshToken).isNotEqualTo(firstRefreshToken);
    }

    @Test
    void shouldRejectInvalidCredentials() throws Exception {
        LoginRequest request = new LoginRequest("admin@tallerzapata.local", "invalid-password");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Credenciales invalidas"));
    }

    @Test
    void shouldLogoutCurrentRefreshTokenAndRejectFurtherRefresh() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@tallerzapata.local", "password");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginBody = objectMapper.readTree(loginResult.getResponse().getContentAsByteArray());
        String accessToken = loginBody.get("accessToken").asText();
        String refreshToken = loginBody.get("refreshToken").asText();

        LogoutRequest logoutRequest = new LogoutRequest(refreshToken, false);

        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(logoutRequest)))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new RefreshTokenRequest(refreshToken))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Refresh token revocado"));
    }

    @Test
    void shouldRejectReusedRefreshToken() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@tallerzapata.local", "password");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginBody = objectMapper.readTree(loginResult.getResponse().getContentAsByteArray());
        String firstRefreshToken = loginBody.get("refreshToken").asText();

        MvcResult rotateResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new RefreshTokenRequest(firstRefreshToken))))
                .andExpect(status().isOk())
                .andReturn();

        String secondRefreshToken = objectMapper.readTree(rotateResult.getResponse().getContentAsByteArray())
                .get("refreshToken")
                .asText();

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new RefreshTokenRequest(firstRefreshToken))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Refresh token reutilizado"));

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(new RefreshTokenRequest(secondRefreshToken))))
                .andExpect(status().isOk());
    }
}
