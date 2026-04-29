package com.tallerzapata.backend.api.operation;

import com.tallerzapata.backend.testsupport.TestDatabaseCleaner;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OperationCatalogIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();
        jdbcTemplate.update(
                "INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                2L, "00000000-0000-0000-0000-000000000200", "consulta", "consulta@tallerzapata.local", "hash", "Carlos", "Consulta", true
        );
    }

    @Test
    void shouldExposeOperationCatalogsForFrontend() throws Exception {
        mockMvc.perform(get("/api/v1/operation/catalogs")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentStatusCodes.length()").isNumber())
                .andExpect(jsonPath("$.taskPriorityCodes[0].code").value("BAJA"))
                .andExpect(jsonPath("$.taskStatusCodes.length()").isNumber())
                .andExpect(jsonPath("$.fuelCodes.length()").isNumber())
                .andExpect(jsonPath("$.intakeItemTypeCodes.length()").isNumber())
                .andExpect(jsonPath("$.intakeItemStatusCodes.length()").isNumber())
                .andExpect(jsonPath("$.reentryStatusCodes.length()").isNumber());
    }

    @Test
    void shouldRejectOperationCatalogsWithoutPermission() throws Exception {
        mockMvc.perform(get("/api/v1/operation/catalogs")
                        .header("X-User-Id", "2"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("El usuario no tiene el permiso requerido: turno.ver"));
    }
}
