package com.tallerzapata.backend.application.casefile.todoriskstate;

import com.tallerzapata.backend.infrastructure.persistence.casefile.CaseRepository;
import com.tallerzapata.backend.infrastructure.persistence.todoriskstate.TodoRiesgoEffectiveStateRepository;
import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Lock;
import java.lang.reflect.Method;
import static org.junit.jupiter.api.Assertions.assertEquals;

class TodoRiesgoEffectiveStateLockRepositoryTest {
    @Test
    void declaresCaseThenProjectionPessimisticWriteLocks() throws Exception {
        assertPessimisticWrite(CaseRepository.class, "findByIdForUpdate");
        assertPessimisticWrite(TodoRiesgoEffectiveStateRepository.class, "findByCaseIdForUpdate");
    }

    private void assertPessimisticWrite(Class<?> repository, String methodName) throws Exception {
        Method method = repository.getMethod(methodName, Long.class);
        assertEquals(LockModeType.PESSIMISTIC_WRITE, method.getAnnotation(Lock.class).value());
    }
}
