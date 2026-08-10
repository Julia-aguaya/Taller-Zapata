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
        Long caseId = jdbc.queryForObject("select id from casos order by id limit 1", Long.class);
        jdbc.update("delete from todo_riesgo_effective_state where caso_id = ?", caseId);
        jdbc.update("insert into todo_riesgo_effective_state (caso_id, tramite_codigo, reparacion_codigo) values (?, ?, ?)", caseId, "SIN_PRESENTAR", "EN_TRAMITE");
        assertThrows(DataIntegrityViolationException.class, () -> jdbc.update(
                "insert into todo_riesgo_effective_state (caso_id, tramite_codigo, reparacion_codigo) values (?, ?, ?)", caseId, "SIN_PRESENTAR", "EN_TRAMITE"));
        assertThrows(DataIntegrityViolationException.class, () -> jdbc.update(
                "update todo_riesgo_effective_state set reparacion_codigo = 'INVALIDO' where caso_id = ?", caseId));
    }
}
