package com.tallerzapata.backend.application.casefile.todoriskstate;

import com.tallerzapata.backend.application.common.ConflictException;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeEntity;
import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseTypeRepository;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoEffectiveStateHistoryRepository;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoEffectiveStateRepository;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoStateFactsEntity;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoStateFactsRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TodoRiesgoNoRepairActionTest {
    @Test
    void persistsAuditableNoRepairOnlyOnceAndRejectsMissingReason() {
        Fixture fixture = todoRiesgoFixture();

        fixture.recalculator.markNoRepair(10L, "Dano estructural", 7L);
        fixture.recalculator.markNoRepair(10L, "Dano estructural", 7L);

        verify(fixture.factsRepository).save(any(TodoRiesgoStateFactsEntity.class));
        verify(fixture.historyRepository, times(2)).save(any());
        assertThrows(ConflictException.class, () -> fixture.recalculator.markNoRepair(10L, " ", 7L));
    }

    @Test
    void rejectsNonTodoRiesgoWithoutWritingFactsOrHistory() {
        Fixture fixture = fixture("PARTICULAR");

        assertThrows(ConflictException.class, () -> fixture.recalculator.markNoRepair(10L, "Dano estructural", 7L));

        verifyNoInteractions(fixture.factsRepository, fixture.stateRepository, fixture.historyRepository);
    }

    private Fixture todoRiesgoFixture() { return fixture("TODO_RIESGO"); }

    private Fixture fixture(String caseTypeCode) {
        CaseRepository caseRepository = mock(CaseRepository.class);
        CaseTypeRepository caseTypeRepository = mock(CaseTypeRepository.class);
        TodoRiesgoEffectiveStateRepository stateRepository = mock(TodoRiesgoEffectiveStateRepository.class);
        TodoRiesgoEffectiveStateHistoryRepository historyRepository = mock(TodoRiesgoEffectiveStateHistoryRepository.class);
        TodoRiesgoStateFactsRepository factsRepository = mock(TodoRiesgoStateFactsRepository.class);
        TodoRiesgoEffectiveStateFactsLoader loader = mock(TodoRiesgoEffectiveStateFactsLoader.class);
        CaseEntity caseEntity = mock(CaseEntity.class); when(caseEntity.getCaseTypeId()).thenReturn(3L);
        CaseTypeEntity caseType = mock(CaseTypeEntity.class); when(caseType.getCode()).thenReturn(caseTypeCode);
        when(caseRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(caseEntity));
        when(caseTypeRepository.findById(3L)).thenReturn(Optional.of(caseType));
        AtomicReference<TodoRiesgoStateFactsEntity> facts = new AtomicReference<>();
        when(factsRepository.findById(10L)).thenAnswer(invocation -> Optional.ofNullable(facts.get()));
        when(factsRepository.save(any(TodoRiesgoStateFactsEntity.class))).thenAnswer(invocation -> {
            TodoRiesgoStateFactsEntity saved = invocation.getArgument(0);
            facts.set(saved);
            return saved;
        });
        when(stateRepository.findByCaseIdForUpdate(10L)).thenReturn(Optional.empty());
        when(loader.load(caseEntity)).thenReturn(new TodoRiesgoEffectiveStateFacts(null, false, null, null, null, true, null, false, java.util.List.of()));
        return new Fixture(new TodoRiesgoEffectiveStateRecalculator(caseRepository, caseTypeRepository, stateRepository, historyRepository, factsRepository, loader), factsRepository, stateRepository, historyRepository);
    }

    private record Fixture(TodoRiesgoEffectiveStateRecalculator recalculator, TodoRiesgoStateFactsRepository factsRepository,
                           TodoRiesgoEffectiveStateRepository stateRepository, TodoRiesgoEffectiveStateHistoryRepository historyRepository) { }
}
