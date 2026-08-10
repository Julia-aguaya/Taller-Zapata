package com.tallerzapata.backend.application.repair;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TodoRiesgoStateRepairCommandTest {
    @Test
    void acceptsOnlyDryRunAndApplyForTheTodoRiesgoRepairCommand() {
        assertFalse(TodoRiesgoStateRepairCommand.parse(new String[]{"repair/recalculate-todo-risk-states", "--dry-run"}));
        assertTrue(TodoRiesgoStateRepairCommand.parse(new String[]{"repair/recalculate-todo-risk-states", "--apply"}));
        assertThrows(IllegalArgumentException.class, () -> TodoRiesgoStateRepairCommand.parse(new String[]{"repair/recalculate-todo-risk-states"}));
        assertThrows(IllegalArgumentException.class, () -> TodoRiesgoStateRepairCommand.parse(new String[]{"repair/recalculate-todo-risk-states", "--force"}));
    }
}
