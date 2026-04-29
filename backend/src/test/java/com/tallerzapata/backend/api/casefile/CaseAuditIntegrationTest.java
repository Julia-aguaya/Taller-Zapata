package com.tallerzapata.backend.api.casefile;

import com.tallerzapata.backend.testsupport.TestDatabaseCleaner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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
class CaseAuditIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.cleanAll();

        seedData();
    }

    @Test
    void shouldListAuditEventsFilteredByActionDomainAndUser() throws Exception {
        mockMvc.perform(get("/api/v1/cases/100/audit/events")
                        .header("X-User-Id", "1")
                        .param("actionCode", "transicionar_estado")
                        .param("domain", "tramite")
                        .param("userId", "3")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].actionCode").value("transicionar_estado"))
                .andExpect(jsonPath("$[0].domain").value("tramite"))
                .andExpect(jsonPath("$[0].userId").value(3));
    }

    @Test
    void shouldRejectAuditQueryWhenUserLacksAuditPermission() throws Exception {
        mockMvc.perform(get("/api/v1/cases/100/audit/events")
                        .header("X-User-Id", "3"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("El usuario no tiene el permiso requerido: auditoria.ver"));
    }

    @Test
    void shouldPaginateAuditEventsWithPageAndSize() throws Exception {
        mockMvc.perform(get("/api/v1/cases/100/audit/events")
                        .header("X-User-Id", "1")
                        .param("page", "0")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(1002));

        mockMvc.perform(get("/api/v1/cases/100/audit/events")
                        .header("X-User-Id", "1")
                        .param("page", "1")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(1001));
    }

    private void seedData() {
        jdbcTemplate.update(
                "INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, activo) VALUES (?, ?, ?, ?, ?, ?, ?)",
                1L,
                "00000000-0000-0000-0000-000000001001",
                "fisica",
                "Ana",
                "Scope",
                "Ana Scope",
                true
        );
        jdbcTemplate.update(
                "INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)",
                1L,
                "00000000-0000-0000-0000-000000002001",
                "AA123BB",
                "AA123BB",
                true
        );

        jdbcTemplate.update(
                "INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                100L,
                "00000000-0000-0000-0000-000000003100",
                "0100PZ",
                100L,
                1L,
                1L,
                1L,
                1L,
                1L,
                false,
                1L,
                1L,
                4L,
                7L,
                9L,
                11L,
                "MEDIA"
        );

        jdbcTemplate.update(
                "INSERT INTO usuarios (id, public_id, username, email, password_hash, nombre, apellido, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                3L,
                "00000000-0000-0000-0000-000000000300",
                "operador-zapata",
                "operador-zapata@tallerzapata.local",
                "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
                "Operador",
                "Sucursal",
                true
        );
        jdbcTemplate.update(
                "INSERT INTO usuario_roles (id, usuario_id, rol_id, organizacion_id, sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)",
                3L,
                3L,
                2L,
                1L,
                1L,
                true
        );

        jdbcTemplate.update(
                "INSERT INTO auditoria_eventos (id, usuario_id, caso_id, entidad_tipo, entidad_id, accion_codigo, antes_json, despues_json, metadata_json, ip_origen, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, JSON '{\"domain\":\"tramite\",\"stateCode\":\"INGRESADO\"}', JSON '{\"domain\":\"tramite\",\"stateCode\":\"EN_TRAMITE\"}', JSON '{\"actionCode\":\"tramite.avanzar\"}', ?, ?, CURRENT_TIMESTAMP)",
                1001L,
                3L,
                100L,
                "casos",
                100L,
                "transicionar_estado",
                "127.0.0.1",
                "JUnit"
        );
        jdbcTemplate.update(
                "INSERT INTO auditoria_eventos (id, usuario_id, caso_id, entidad_tipo, entidad_id, accion_codigo, antes_json, despues_json, metadata_json, ip_origen, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, JSON '{\"priorityCode\":\"MEDIA\"}', JSON '{\"priorityCode\":\"ALTA\"}', JSON '{\"source\":\"manual\"}', ?, ?, CURRENT_TIMESTAMP)",
                1002L,
                1L,
                100L,
                "casos",
                100L,
                "actualizar",
                "127.0.0.1",
                "JUnit"
        );
    }
}
