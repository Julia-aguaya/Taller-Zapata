package com.tallerzapata.backend.application.workflow;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WorkflowTransitionValidatorTest {

    private WorkflowTransitionValidator validator;

    @BeforeEach
    void setUp() {
        Set<String> allowed = Set.of(
                "PENDIENTE->EN_DIAGNOSTICO",
                "EN_DIAGNOSTICO->PENDIENTE_REPARACION",
                "PENDIENTE_REPARACION->EN_REPARACION",
                "EN_REPARACION->REPARADO",
                "REPARADO->CERRADO"
        );
        validator = new WorkflowTransitionValidator(allowed);
    }

    @Test
    void shouldAllowPendingToEnDiagnostico() {
        assertTrue(validator.isValid("PENDIENTE", "EN_DIAGNOSTICO"));
    }

    @Test
    void shouldNotAllowPendingToClosed() {
        assertFalse(validator.isValid("PENDIENTE", "CERRADO"));
    }

    @Test
    void shouldAllowEnReparacionToReparado() {
        assertTrue(validator.isValid("EN_REPARACION", "REPARADO"));
    }

    @Test
    void shouldNotAllowPendienteReparacionToClosed() {
        assertFalse(validator.isValid("PENDIENTE_REPARACION", "CERRADO"));
    }

    @Test
    void shouldRejectNullStates() {
        assertFalse(validator.isValid(null, "CERRADO"));
        assertFalse(validator.isValid("PENDIENTE", null));
        assertFalse(validator.isValid(null, null));
    }
}
