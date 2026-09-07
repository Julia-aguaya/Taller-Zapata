package com.tallerzapata.backend.infrastructure.persistence.todoriskstate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TodoRiesgoEffectiveStatePersistenceTest {
    @Autowired private JdbcTemplate jdbc;

    @Test
    void migrationEnforcesOneProjectionAndCanonicalCodes() {
        // Autonomo: otras clases corren cleanAll() y borran los casos demo de V45.
        jdbc.update("INSERT INTO personas (id, public_id, tipo_persona, nombre, apellido, nombre_mostrar, tipo_documento_codigo, numero_documento, numero_documento_normalizado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                99001L, "00000000-0000-0000-0000-000000990010", "fisica", "Persist", "Test", "Persist Test", "DNI", "39999991", "39999991", true);
        jdbc.update("INSERT INTO vehiculos (id, public_id, dominio, dominio_normalizado, activo) VALUES (?, ?, ?, ?, ?)",
                99002L, "00000000-0000-0000-0000-000000990020", "AZ990TZ", "AZ990TZ", true);
        jdbc.update("INSERT INTO casos (id, public_id, codigo_carpeta, numero_orden, tipo_tramite_id, organizacion_id, sucursal_id, vehiculo_principal_id, cliente_principal_persona_id, referenciado, usuario_creador_id, estado_tramite_actual_id, estado_reparacion_actual_id, estado_pago_actual_id, estado_documentacion_actual_id, estado_legal_actual_id, prioridad_codigo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                99003L, "00000000-0000-0000-0000-000000990030", "9900TZ", 99003L, 2L, 1L, 1L, 99002L, 99001L, false, 1L, 1L, 4L, 7L, 9L, 11L, "MEDIA");
        Long caseId = 99003L;
        jdbc.update("delete from todo_riesgo_effective_state where caso_id = ?", caseId);
        jdbc.update("insert into todo_riesgo_effective_state (caso_id, tramite_codigo, reparacion_codigo) values (?, ?, ?)", caseId, "SIN_PRESENTAR", "EN_TRAMITE");
        assertThrows(DataIntegrityViolationException.class, () -> jdbc.update(
                "insert into todo_riesgo_effective_state (caso_id, tramite_codigo, reparacion_codigo) values (?, ?, ?)", caseId, "SIN_PRESENTAR", "EN_TRAMITE"));
        assertThrows(DataIntegrityViolationException.class, () -> jdbc.update(
                "update todo_riesgo_effective_state set reparacion_codigo = 'INVALIDO' where caso_id = ?", caseId));
    }
}
