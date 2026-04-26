package com.tallerzapata.backend.infrastructure.persistence.person;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PersonContactRepository extends JpaRepository<PersonContactEntity, Long> {

    List<PersonContactEntity> findByPersonIdOrderByPrincipalDescIdDesc(Long personId);

    Optional<PersonContactEntity> findByIdAndPersonId(Long id, Long personId);

    @Modifying
    @Query("update PersonContactEntity c set c.principal = false where c.personId = :personId")
    void resetPrincipalByPersonId(@Param("personId") Long personId);

    @Modifying
    @Query("update PersonContactEntity c set c.principal = false where c.personId = :personId and c.id <> :contactId")
    void resetPrincipalByPersonIdAndIdNot(@Param("personId") Long personId, @Param("contactId") Long contactId);
}
