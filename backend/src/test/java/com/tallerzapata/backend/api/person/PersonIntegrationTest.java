package com.tallerzapata.backend.api.person;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tallerzapata.backend.testsupport.TestDatabaseCleaner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PersonIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();

        jdbcTemplate.update(
                "INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                10L,
                "00000000-0000-0000-0000-000000001110",
                "fisica",
                "Martin",
                "Perez",
                "Martin Perez",
                "DNI",
                "30123123",
                "30123123",
                true
        );
    }

    @Test
    void shouldManageContactsAndAddressesWithSinglePrincipal() throws Exception {
        PersonContactUpsertRequest firstContact = new PersonContactUpsertRequest("CEL", "+5491111111111", true, false, null);
        PersonContactUpsertRequest secondContact = new PersonContactUpsertRequest("EMAIL", "martin@test.com", true, true, "mail principal");

        mockMvc.perform(post("/api/v1/persons/10/contacts")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(firstContact)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.principal").value(true));

        mockMvc.perform(post("/api/v1/persons/10/contacts")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(secondContact)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipoContactoCodigo").value("EMAIL"));

        mockMvc.perform(get("/api/v1/persons/10/contacts")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tipoContactoCodigo").value("EMAIL"))
                .andExpect(jsonPath("$[0].principal").value(true));

        Integer principalContacts = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM persona_contactos WHERE persona_id = ? AND principal = 1",
                Integer.class,
                10L
        );
        assertThat(principalContacts).isEqualTo(1);

        PersonAddressUpsertRequest firstAddress = new PersonAddressUpsertRequest("LEGAL", "Calle 1", "123", null, null, "Rosario", "Santa Fe", "2000", "AR", true);
        PersonAddressUpsertRequest secondAddress = new PersonAddressUpsertRequest("REAL", "Calle 2", "456", null, null, "Rosario", "Santa Fe", "2000", "AR", true);

        mockMvc.perform(post("/api/v1/persons/10/addresses")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(firstAddress)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/persons/10/addresses")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(secondAddress)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipoDomicilioCodigo").value("REAL"));

        mockMvc.perform(get("/api/v1/persons/10/addresses")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tipoDomicilioCodigo").value("REAL"));

        Integer principalAddresses = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM persona_domicilios WHERE persona_id = ? AND principal = 1",
                Integer.class,
                10L
        );
        assertThat(principalAddresses).isEqualTo(1);
    }

    @Test
    void shouldUpdateContactByPersonScope() throws Exception {
        jdbcTemplate.update(
                "INSERT INTO persona_contactos (id, persona_id, tipo_contacto_codigo, valor, principal, validado, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?)",
                99L,
                10L,
                "CEL",
                "+5491100000000",
                true,
                false,
                null
        );

        PersonContactUpsertRequest update = new PersonContactUpsertRequest("EMAIL", "nuevo@test.com", true, true, "ok");

        mockMvc.perform(put("/api/v1/persons/10/contacts/99")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipoContactoCodigo").value("EMAIL"))
                .andExpect(jsonPath("$.valor").value("nuevo@test.com"));
    }

    @Test
    void shouldRejectInvalidContactCode() throws Exception {
        PersonContactUpsertRequest invalid = new PersonContactUpsertRequest("FAX", "12345678", true, false, null);

        mockMvc.perform(post("/api/v1/persons/10/contacts")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(invalid)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("tipoContactoCodigo no permitido: FAX"));
    }

    @Test
    void shouldSearchPersonsByAutocompleteQuery() throws Exception {
        jdbcTemplate.update(
                "INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                11L,
                "00000000-0000-0000-0000-000000001111",
                "fisica",
                "Lucia",
                "Moreno",
                "Lucia Moreno",
                "DNI",
                "40111222",
                "40111222",
                true
        );

        mockMvc.perform(get("/api/v1/persons")
                        .param("q", "martin")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(10));

        mockMvc.perform(get("/api/v1/persons")
                        .param("q", "4011")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(11));
    }
}
