package com.tallerzapata.backend.application.repair;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ParticularStateRepairCommandTest {
    @Test
    void acceptsOnlyDryRunAndApplyForTheRepairCommand() {
        assertFalse(ParticularStateRepairCommand.parse(new String[]{"repair/recalculate-particular-states", "--dry-run"}));
        assertTrue(ParticularStateRepairCommand.parse(new String[]{"repair/recalculate-particular-states", "--apply"}));
        assertThrows(IllegalArgumentException.class, () -> ParticularStateRepairCommand.parse(new String[]{"repair/recalculate-particular-states"}));
        assertThrows(IllegalArgumentException.class, () -> ParticularStateRepairCommand.parse(new String[]{"repair/recalculate-particular-states", "--apply", "--dry-run"}));
        assertThrows(IllegalArgumentException.class, () -> ParticularStateRepairCommand.parse(new String[]{"repair/recalculate-particular-states", "--force"}));
    }
}
